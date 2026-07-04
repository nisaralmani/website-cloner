import sqlite3
try:
    conn = sqlite3.connect('/var/www/bybelt/shopify-chat/prisma/dev.sqlite')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM Session')
    print("Sessions:", cursor.fetchall())
    cursor.execute('SELECT * FROM ShopLink')
    print("ShopLinks:", cursor.fetchall())
except Exception as e:
    print("Error:", e)
