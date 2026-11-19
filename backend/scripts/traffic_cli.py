"""
TrafficFlow — City Traffic Intelligence Platform
Command Line Operator Interface (CLI)
"""
import argparse
import json
import sys
import urllib.request
import urllib.parse

BASE_URL = "http://127.0.0.1:8000/api/v1"

def make_request(path: str, method: str = "GET", data: dict = None, token: str = None):
    url = f"{BASE_URL}{path}"
    headers = {"User-Agent": "TrafficFlowCLI/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None
    if data:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.getcode(), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8") if e.fp else ""
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"error": err_body}
    except Exception as e:
        return 0, {"error": str(e)}

def get_admin_token():
    status, data = make_request("/auth/login", method="POST", data={"username": "admin", "password": "admin123"})
    if status == 200:
        return data.get("access_token")
    return None

def cmd_status(args):
    status, data = make_request("/dashboard/stats")
    if status != 200:
        print(f"Error fetching status (HTTP {status}): {data}")
        return
    print("\n" + "=" * 50)
    print(" TrafficFlow — City Traffic Intelligence Status")
    print("=" * 50)
    print(f" System Status:            {data.get('system_status')}")
    print(f" Registered Cameras:       {data.get('registered_cameras')}")
    print(f" Online / Offline / Degr:  {data.get('online_cameras')} / {data.get('offline_cameras')} / {data.get('degraded_cameras')}")
    print(f" Total Detections Today:   {data.get('total_detections_today'):,}")
    print(f" Active Tracking Sessions: {data.get('active_tracking_sessions')}")
    print(f" Active Incident Alerts:   {data.get('active_alerts')}")
    print(f" Urban Congestion Index:   {data.get('congestion_index')}%")
    print(f" Background Video Jobs:    {data.get('processing_jobs')}")
    print("=" * 50 + "\n")

def cmd_cameras(args):
    status, cameras = make_request("/cameras")
    if status != 200:
        print(f"Error fetching cameras (HTTP {status}): {cameras}")
        return
    print(f"\nRegistered Optical Sensors ({len(cameras)} total):\n")
    print(f"{'ID':<10} {'Name':<35} {'Group':<18} {'FPS':<6} {'Status':<10} {'Masked RTSP':<35}")
    print("-" * 115)
    for c in cameras:
        rtsp = c.get("rtsp_url_masked") or "N/A"
        print(f"{c['camera_id']:<10} {c['name']:<35} {c['camera_group']:<18} {c['fps']:<6} {c['status']:<10} {rtsp:<35}")
    print("")

def cmd_alerts(args):
    status, alerts = make_request("/alerts/")
    if status != 200:
        print(f"Error fetching alerts (HTTP {status}): {alerts}")
        return
    if args.status and args.status != "all":
        alerts = [a for a in alerts if a.get("status") == args.status]
    print(f"\nIncident Alerts ({len(alerts)} records):\n")
    print(f"{'ID':<10} {'Severity':<10} {'Status':<14} {'Location':<25} {'Title':<45}")
    print("-" * 105)
    for a in alerts:
        print(f"{a['alert_id']:<10} {a['severity']:<10} {a['status']:<14} {a['location'][:24]:<25} {a['title'][:44]:<45}")
    print("")

def cmd_cluster(args):
    payload = {"algorithm": args.algorithm}
    if args.algorithm == "kmeans":
        payload["k"] = args.k
    elif args.algorithm == "dbscan":
        payload["eps"] = args.eps
        payload["min_samples"] = args.min_samples
    elif args.algorithm == "agglomerative":
        payload["k"] = args.k
        payload["linkage"] = args.linkage

    print(f"\nExecuting {args.algorithm.upper()} trajectory clustering...")
    status, result = make_request("/clustering/run", method="POST", data=payload)
    if status != 200:
        print(f"Clustering error (HTTP {status}): {result}")
        return

    m = result.get("metrics", {})
    print("\n" + "=" * 55)
    print(f" Machine Learning Route Clustering — {result.get('algorithm')}")
    print("=" * 55)
    print(f" Total Trajectory Samples:  {m.get('total_samples')}")
    print(f" Discovered Clusters:       {m.get('clusters')}")
    print(f" Noise / Outlier Trajectories: {m.get('noise_points')} ({m.get('noise_ratio_pct')}%)")
    print(f" Silhouette Score:          {m.get('silhouette'):.3f}")
    print(f" Davies-Bouldin Index:      {m.get('davies_bouldin'):.3f}")
    print(f" Calinski-Harabasz Score:   {m.get('calinski_harabasz'):.2f}")
    print(f" Runtime Latency:           {m.get('runtime_ms'):.1f} ms")
    print("=" * 55)

    print("\nCluster Breakdown:")
    for cb in result.get("cluster_breakdown", []):
        print(f"  • {cb.get('name')}: {cb.get('count')} trajectories (Dominant: {cb.get('dominantClass')}, Avg: {cb.get('avgTime')})")
    print("")

def cmd_export(args):
    token = get_admin_token()
    if args.format == "geojson":
        path = "/trajectories/export/geojson"
        default_file = "trajectories_export.geojson"
    else:
        path = "/trajectories/export/csv"
        default_file = "trajectories_export.csv"

    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            out_file = args.output or default_file
            with open(out_file, "wb") as f:
                f.write(content)
            print(f"Successfully exported {len(content):,} bytes to '{out_file}'.")
    except Exception as e:
        print(f"Export failed: {e}")

def main():
    parser = argparse.ArgumentParser(
        description="TrafficFlow — City Traffic Intelligence Platform CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python backend/scripts/traffic_cli.py status
  python backend/scripts/traffic_cli.py cameras
  python backend/scripts/traffic_cli.py alerts --status active
  python backend/scripts/traffic_cli.py cluster --algorithm kmeans --k 4
  python backend/scripts/traffic_cli.py cluster --algorithm dbscan --eps 0.5
  python backend/scripts/traffic_cli.py export --format geojson --output city_routes.geojson
        """
    )
    subparsers = parser.add_subparsers(dest="command", help="Operational Subcommands")

    # Status
    subparsers.add_parser("status", help="Display macro-level city traffic status")

    # Cameras
    subparsers.add_parser("cameras", help="List registered CCTV and ANPR sensors")

    # Alerts
    p_alerts = subparsers.add_parser("alerts", help="List and inspect incident alerts")
    p_alerts.add_argument("--status", choices=["all", "active", "under_review", "resolved", "dismissed"], default="all")

    # Clustering
    p_clust = subparsers.add_parser("cluster", help="Run trajectory route clustering")
    p_clust.add_argument("--algorithm", choices=["kmeans", "dbscan", "agglomerative"], default="kmeans")
    p_clust.add_argument("--k", type=int, default=3, help="Cluster count for K-Means and Agglomerative")
    p_clust.add_argument("--eps", type=float, default=0.5, help="Epsilon radius for DBSCAN")
    p_clust.add_argument("--min-samples", type=int, default=2, help="Min samples for DBSCAN")
    p_clust.add_argument("--linkage", choices=["ward", "complete", "average"], default="ward")

    # Export
    p_exp = subparsers.add_parser("export", help="Export reconstructed trajectory routes")
    p_exp.add_argument("--format", choices=["geojson", "csv"], default="geojson")
    p_exp.add_argument("--output", type=str, help="Destination output filename")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    dispatch = {
        "status": cmd_status,
        "cameras": cmd_cameras,
        "alerts": cmd_alerts,
        "cluster": cmd_cluster,
        "export": cmd_export,
    }
    dispatch[args.command](args)

if __name__ == "__main__":
    main()

