"""
ByteTrack Multi-Object Tracking Engine
Implements Kalman Filter state estimation and Two-Stage Hungarian/IoU Data Association.
Ref: "ByteTrack: Multi-Object Tracking by Associating Every Detection Box" (Zhang et al.)
"""

import numpy as np
from scipy.optimize import linear_sum_assignment
from typing import List, Tuple, Dict, Any, Optional

class KalmanFilter:
    """
    Kalman filter for tracking bounding boxes in image space.
    State vector: [x, y, a, h, vx, vy, va, vh]
    x, y: bounding box center
    a: aspect ratio (w / h)
    h: bounding box height
    vx, vy, va, vh: respective velocities
    """
    def __init__(self):
        ndim = 4
        dt = 1.0

        # Motion model transition matrix F
        self._motion_mat = np.eye(2 * ndim, 2 * ndim)
        for i in range(ndim):
            self._motion_mat[i, ndim + i] = dt

        # Observation matrix H
        self._update_mat = np.eye(ndim, 2 * ndim)

        # Process and measurement uncertainties
        self._std_weight_position = 1.0 / 20
        self._std_weight_velocity = 1.0 / 160

    def initiate(self, measurement: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Create track from unassociated measurement [x, y, a, h]."""
        mean_pos = measurement
        mean_vel = np.zeros_like(mean_pos)
        mean = np.r_[mean_pos, mean_vel]

        std = [
            2 * self._std_weight_position * measurement[3],
            2 * self._std_weight_position * measurement[3],
            1e-2,
            2 * self._std_weight_position * measurement[3],
            10 * self._std_weight_velocity * measurement[3],
            10 * self._std_weight_velocity * measurement[3],
            1e-5,
            10 * self._std_weight_velocity * measurement[3]
        ]
        covariance = np.diag(np.square(std))
        return mean, covariance

    def predict(self, mean: np.ndarray, covariance: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Predict the next state."""
        std_pos = [
            self._std_weight_position * mean[3],
            self._std_weight_position * mean[3],
            1e-2,
            self._std_weight_position * mean[3]
        ]
        std_vel = [
            self._std_weight_velocity * mean[3],
            self._std_weight_velocity * mean[3],
            1e-5,
            self._std_weight_velocity * mean[3]
        ]
        motion_cov = np.diag(np.square(np.r_[std_pos, std_vel]))

        mean = np.dot(self._motion_mat, mean)
        covariance = np.linalg.multi_dot((self._motion_mat, covariance, self._motion_mat.T)) + motion_cov
        return mean, covariance

    def update(self, mean: np.ndarray, covariance: np.ndarray, measurement: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Project state to measurement space and update with observation."""
        std = [
            self._std_weight_position * mean[3],
            self._std_weight_position * mean[3],
            1e-1,
            self._std_weight_position * mean[3]
        ]
        innovation_cov = np.diag(np.square(std))

        projected_mean = np.dot(self._update_mat, mean)
        projected_cov = np.linalg.multi_dot((self._update_mat, covariance, self._update_mat.T)) + innovation_cov

        chol_factor, lower = np.linalg.cholesky(projected_cov), True
        kalman_gain = np.linalg.solve(projected_cov, np.dot(covariance, self._update_mat.T).T).T

        innovation = measurement - projected_mean
        new_mean = mean + np.dot(innovation, kalman_gain.T)
        new_covariance = covariance - np.linalg.multi_dot((kalman_gain, projected_cov, kalman_gain.T))
        return new_mean, new_covariance


def compute_iou_matrix(atlbrs: np.ndarray, btlbrs: np.ndarray) -> np.ndarray:
    """Computes IoU distance matrix (1.0 - IoU) between sets of boxes [x1, y1, x2, y2]."""
    if len(atlbrs) == 0 or len(btlbrs) == 0:
        return np.empty((len(atlbrs), len(btlbrs)))

    ious = np.zeros((len(atlbrs), len(btlbrs)), dtype=float)
    for i, a in enumerate(atlbrs):
        for j, b in enumerate(btlbrs):
            x1 = max(a[0], b[0])
            y1 = max(a[1], b[1])
            x2 = min(a[2], b[2])
            y2 = min(a[3], b[3])
            w = max(0.0, x2 - x1)
            h = max(0.0, y2 - y1)
            inter = w * h
            area_a = (a[2] - a[0]) * (a[3] - a[1])
            area_b = (b[2] - b[0]) * (b[3] - b[1])
            union = area_a + area_b - inter
            ious[i, j] = inter / union if union > 0 else 0.0

    return 1.0 - ious


class STrack:
    """Single vehicle track state container."""
    _count = 0

    def __init__(self, tlwh: np.ndarray, score: float, category: str):
        # tlwh: top-left x, top-left y, width, height
        self.tlwh = np.asarray(tlwh, dtype=float)
        self.score = score
        self.category = category
        self.is_activated = False

        self.kalman_filter = KalmanFilter()
        self.mean: Optional[np.ndarray] = None
        self.covariance: Optional[np.ndarray] = None

        self.track_id = 0
        self.state = 0  # 0: New, 1: Tracked, 2: Lost, 3: Removed
        self.frame_id = 0
        self.start_frame = 0
        self.tracklet_len = 0
        self.history: List[Dict[str, Any]] = []

    @classmethod
    def next_id(cls) -> int:
        cls._count += 1
        return cls._count

    @classmethod
    def reset_counter(cls, start: int = 100):
        cls._count = start

    @property
    def tlbr(self) -> np.ndarray:
        ret = self.tlwh.copy()
        ret[2] += ret[0]
        ret[3] += ret[1]
        return ret

    def to_xyah(self) -> np.ndarray:
        ret = self.tlwh.copy()
        ret[0] += ret[2] / 2.0
        ret[1] += ret[3] / 2.0
        ret[2] /= ret[3]
        return ret

    def activate(self, kalman_filter: KalmanFilter, frame_id: int):
        self.track_id = self.next_id()
        self.mean, self.covariance = kalman_filter.initiate(self.to_xyah())
        self.tracklet_len = 0
        self.state = 1  # Tracked
        self.is_activated = True
        self.frame_id = frame_id
        self.start_frame = frame_id
        self._record_history(frame_id)

    def re_activate(self, new_track: 'STrack', frame_id: int, new_id: bool = False):
        self.mean, self.covariance = self.kalman_filter.update(
            self.mean, self.covariance, new_track.to_xyah()
        )
        self.update_tlwh()
        self.tracklet_len += 1
        self.state = 1
        self.is_activated = True
        self.frame_id = frame_id
        self.score = new_track.score
        if new_id:
            self.track_id = self.next_id()
        self._record_history(frame_id)

    def update(self, new_track: 'STrack', frame_id: int):
        self.frame_id = frame_id
        self.tracklet_len += 1
        self.mean, self.covariance = self.kalman_filter.update(
            self.mean, self.covariance, new_track.to_xyah()
        )
        self.update_tlwh()
        self.state = 1
        self.is_activated = True
        self.score = new_track.score
        self._record_history(frame_id)

    def predict(self):
        if self.mean is not None and self.covariance is not None:
            self.mean, self.covariance = self.kalman_filter.predict(self.mean, self.covariance)
            self.update_tlwh()

    def update_tlwh(self):
        if self.mean is not None:
            w = self.mean[2] * self.mean[3]
            h = self.mean[3]
            x = self.mean[0] - w / 2.0
            y = self.mean[1] - h / 2.0
            self.tlwh = np.array([x, y, w, h])

    def mark_lost(self):
        self.state = 2

    def mark_removed(self):
        self.state = 3

    def _record_history(self, frame_id: int):
        cx = self.tlwh[0] + self.tlwh[2] / 2.0
        cy = self.tlwh[1] + self.tlwh[3] / 2.0
        self.history.append({
            "frame": frame_id,
            "cx": float(cx),
            "cy": float(cy),
            "w": float(self.tlwh[2]),
            "h": float(self.tlwh[3]),
            "score": float(self.score),
            "category": self.category
        })


class ByteTracker:
    """
    ByteTrack Multi-Object Tracker.
    Performs high-confidence and low-confidence two-stage Hungarian association.
    """
    def __init__(
        self,
        track_thresh: float = 0.45,
        match_thresh: float = 0.80,
        low_thresh: float = 0.15,
        max_time_lost: int = 30
    ):
        self.track_thresh = track_thresh
        self.match_thresh = match_thresh
        self.low_thresh = low_thresh
        self.max_time_lost = max_time_lost

        self.tracked_stracks: List[STrack] = []
        self.lost_stracks: List[STrack] = []
        self.removed_stracks: List[STrack] = []
        self.frame_id = 0
        self.kalman_filter = KalmanFilter()

    def update(self, detections: List[Dict[str, Any]], frame_id: int) -> List[STrack]:
        """
        Processes detections for the given frame and updates tracklets.
        detections format: list of dicts with 'x', 'y', 'w', 'h', 'confidence', 'category'
        """
        self.frame_id = frame_id
        activated_stracks = []
        refind_stracks = []
        lost_stracks = []
        removed_stracks = []

        # Predict current locations for all existing tracks
        for track in self.tracked_stracks:
            track.predict()
        for track in self.lost_stracks:
            track.predict()

        # Split detections by confidence
        dets_high = []
        dets_low = []
        for det in detections:
            conf = det["confidence"]
            tlwh = np.array([det["x"], det["y"], det["w"], det["h"]])
            strack = STrack(tlwh, conf, det["category"])
            if conf >= self.track_thresh:
                dets_high.append(strack)
            elif conf >= self.low_thresh:
                dets_low.append(strack)

        # ---------------- Stage 1: Match high-confidence detections ----------------
        track_pool = self.tracked_stracks + self.lost_stracks
        dists = compute_iou_matrix(
            np.array([t.tlbr for t in track_pool]) if track_pool else np.empty((0, 4)),
            np.array([d.tlbr for d in dets_high]) if dets_high else np.empty((0, 4))
        )

        matches_1, u_track_1, u_det_high = self._linear_assignment(dists, self.match_thresh)

        for itracked, idet in matches_1:
            track = track_pool[itracked]
            det = dets_high[idet]
            if track.state == 1:
                track.update(det, self.frame_id)
                activated_stracks.append(track)
            else:
                track.re_activate(det, self.frame_id, new_id=False)
                refind_stracks.append(track)

        # ---------------- Stage 2: Match low-confidence detections with remaining tracks ----------------
        r_tracked_stracks = [track_pool[i] for i in u_track_1 if track_pool[i].state == 1]
        dists_2 = compute_iou_matrix(
            np.array([t.tlbr for t in r_tracked_stracks]) if r_tracked_stracks else np.empty((0, 4)),
            np.array([d.tlbr for d in dets_low]) if dets_low else np.empty((0, 4))
        )

        matches_2, u_track_2, _ = self._linear_assignment(dists_2, 0.5)

        for itracked, idet in matches_2:
            track = r_tracked_stracks[itracked]
            det = dets_low[idet]
            track.update(det, self.frame_id)
            activated_stracks.append(track)

        # Handle tracks still unmatched after Stage 2
        for it in u_track_2:
            track = r_tracked_stracks[it]
            track.mark_lost()
            lost_stracks.append(track)

        # Deal with unmatched high-confidence detections: initiate new tracks
        for idet in u_det_high:
            det = dets_high[idet]
            det.activate(self.kalman_filter, self.frame_id)
            activated_stracks.append(det)

        # Update lost tracks: remove if exceeded max_time_lost
        for track in self.lost_stracks:
            if self.frame_id - track.frame_id > self.max_time_lost:
                track.mark_removed()
                removed_stracks.append(track)

        # Reconstruct active tracked list
        self.tracked_stracks = [t for t in self.tracked_stracks if t.state == 1]
        self.tracked_stracks = list(dict.fromkeys(self.tracked_stracks + activated_stracks + refind_stracks))
        self.lost_stracks = [t for t in self.lost_stracks if t.state == 2 and t not in lost_stracks]
        self.lost_stracks.extend(lost_stracks)
        self.removed_stracks.extend(removed_stracks)

        return [t for t in self.tracked_stracks if t.is_activated]

    def _linear_assignment(self, cost_matrix: np.ndarray, thresh: float):
        if cost_matrix.size == 0:
            return [], list(range(cost_matrix.shape[0])), list(range(cost_matrix.shape[1]))

        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        matches = []
        unmatched_a = set(range(cost_matrix.shape[0]))
        unmatched_b = set(range(cost_matrix.shape[1]))

        for r, c in zip(row_ind, col_ind):
            if cost_matrix[r, c] <= thresh:
                matches.append((r, c))
                unmatched_a.discard(r)
                unmatched_b.discard(c)

        return matches, list(unmatched_a), list(unmatched_b)
