from app.database import SessionLocal
from app.seed import seed_db

def run():
    print("Initializing Database Seeding...")
    db = SessionLocal()
    try:
        seed_db(db)
        print("Database seeded successfully with StadiumOS mock parameters!")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run()
