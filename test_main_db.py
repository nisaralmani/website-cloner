import sqlite3
try:
    conn = sqlite3.connect('/var/www/bybelt/chat/data/bybelt.db')
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, domain FROM workspaces')
    print("Workspaces:", cursor.fetchall())
except Exception as e:
    print("Error:", e)
