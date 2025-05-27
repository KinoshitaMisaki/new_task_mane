import pytest
import os
# Adjust the import path if your app factory or app instance is elsewhere
# This assumes 'app.py' creates 'app' and 'db' instances directly at the root.
from app import app as flask_app, db as sqlalchemy_db # Renamed db to avoid conflict

@pytest.fixture(scope='session') # Use session scope for app factory pattern
def app():
    # Configure the app for testing
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:", # Use in-memory SQLite DB for tests
        # "SQLALCHEMY_DATABASE_URI": f"sqlite:///{os.path.join(os.path.dirname(__file__), 'test.db')}", # Or a test file
        "WTF_CSRF_ENABLED": False, # Disable CSRF for simpler form testing if using Flask-WTF
        "LOGIN_DISABLED": True, # If using Flask-Login, disable login for tests
    })
    
    # Create tables before tests run, clear them after
    with flask_app.app_context():
        sqlalchemy_db.create_all()

    yield flask_app # Provide the app instance to tests

    # Teardown: drop all tables after tests are done for this session
    with flask_app.app_context():
        sqlalchemy_db.session.remove() # Ensure session is clean before dropping
        sqlalchemy_db.drop_all()
        # if "sqlite:///" not in str(sqlalchemy_db.engine.url) and "test.db" in str(sqlalchemy_db.engine.url) :
        #    os.unlink(os.path.join(os.path.dirname(__file__), 'test.db')) # Clean up test.db file

@pytest.fixture() # Default function scope
def client(app):
    return app.test_client()

@pytest.fixture()
def db(app): # Fixture to provide direct db access if needed, ensures app context
    with app.app_context():
        # Not yielding sqlalchemy_db directly, but can be used to set up/tear down per test data
        yield sqlalchemy_db
