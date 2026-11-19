import os
import cv2
import sqlite3

annotated_path = 'data/processed/VID-2026-001_annotated.mp4'
if os.path.exists(annotated_path):
    sz = os.path.getsize(annotated_path) / (1024 * 1024)
    cap = cv2.VideoCapture(annotated_path)
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fc = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    fourcc = int(cap.get(cv2.CAP_PROP_FOURCC))
    codec = ''.join([chr((fourcc >> 8 * i) & 0xFF) for i in range(4)])
    print(f'Annotated video: {annotated_path} ({sz:.2f} MB), {w}x{h}, {fc} frames @ {fps} fps, codec={codec}')
    cap.release()

conn = sqlite3.connect('trafficflow.db')
c = conn.cursor()
c.execute('SELECT COUNT(id), COUNT(DISTINCT tracking_id) FROM vehicle_detections WHERE video_id = ?', ('VID-2026-001',))
total, tracks = c.fetchone()
print(f'Database detections for VID-2026-001: {total} detections, {tracks} unique tracks!')

c.execute('SELECT category, count(id) FROM vehicle_detections WHERE video_id = ? GROUP BY category', ('VID-2026-001',))
for cat, cnt in c.fetchall():
    print(f'  {cat}: {cnt}')

c.execute('UPDATE videos SET status = "completed", detected_vehicles_count = ? WHERE video_id = ?', (tracks, 'VID-2026-001'))
conn.commit()
conn.close()

