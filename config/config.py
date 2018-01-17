from os.path import join, dirname
from os import environ
from dotenv import load_dotenv


class CONFIG:
    def __init__(self):
        dotenv_path = join(dirname(__file__), '..', '.env')
        print(dotenv_path)
        load_dotenv(dotenv_path)

        self.DATABASE_HOST = environ.get("DATABASE_HOST") or 'localhost'
        self.DATABASE_USER = environ.get("DATABASE_USER") or ''
        self.DATABASE_PASSWORD = environ.get("DATABASE_PASSWORD") or ''
        self.DATABASE_NAME = environ.get("DATABASE_NAME") or ''
        self.PORT = environ.get("PORT") or ''
        self.ENV = environ.get("ENV") or 'development'

    def __str__(self):
        s = []
        for attr, value in vars(self).items():
            s.append('%s: %s' % (attr, value))
        return '\n'.join(map(str,s))

    @staticmethod
    def get_config():
        return CONFIG()
