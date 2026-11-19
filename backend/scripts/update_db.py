import sqlite3

conn = sqlite3.connect('trafficflow.db')
c = conn.cursor()
c.execute("UPDATE videos SET progress_pct = 100.0 WHERE progress_pct IS NULL")
c.execute("UPDATE videos SET current_step = 'Ready' WHERE current_step IS NULL")
c.execute("UPDATE videos SET detected_vehicles_count = 0 WHERE detected_vehicles_count IS NULL")
conn.commit()
conn.close()
print("Videos table defaults updated successfully.")
