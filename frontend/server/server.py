#!/usr/bin/python
import json

import flask
from flask import Flask, jsonify, redirect, request
import os

STATIC_PATH = os.path.abspath('dist/')

app = Flask(__name__, static_folder=STATIC_PATH)

@app.route('/')
@app.route('/<path:path>')
def home(path='index.html'):
    return app.send_static_file(path)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=3000, debug=True)