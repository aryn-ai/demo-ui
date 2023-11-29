from flask import Flask, request, jsonify, Response, send_file
import gevent

from gevent import monkey
monkey.patch_all()

from gevent.pywsgi import WSGIServer
import requests
import os
from flask_cors import CORS
from werkzeug.datastructures import Headers
import io
import logging

app = Flask(__name__)
PORT=3000

CORS(app, resources={r"/*": {"origins": "*"}})  # Allow requests from http://localhost:3001 to any route

# Replace this with your actual OpenAI API key
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

# API endpoint of the OpenAI service
OPENAI_API_BASE = "https://api.openai.com"

OPENSEARCH_HOST = os.environ.get("OPENSEARCH_HOST", "localhost")
OPENSEARCH_URL = f"http://{OPENSEARCH_HOST}:9200/"

UI_HOST = os.environ.get("LOAD_BALANCER", "localhost")
UI_BASE = f"http://{UI_HOST}:3001"

badHeaders = [
    'content-encoding',
    'content-length',
    'transfer-encoding',
    'connection',
]

# qa_logger = logging.getLogger("qa_log")
# qa_logger.setLevel(logging.WARNING)
# qalfh = logging.FileHandler("qa.log")
# qalfh.setLevel(logging.INFO)
# qalfh.setFormatter(logging.Formatter('[%(asctime)s]\t[%(levelname)s]\t%(message)s'))
# qa_logger.addHandler(qalfh)


def optionsResp(methods: str):
    # Respond to CORS preflight request
    resp = jsonify({})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    resp.headers['Access-Control-Allow-Methods'] = methods
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return resp


@app.route('/v1/completions', methods=['POST', 'OPTIONS'])
@app.route('/v1/chat/completions', methods=['POST', 'OPTIONS'])
def proxy_stream_request():
    if request.method == 'OPTIONS':
        return optionsResp('POST')

    headers = Headers()
    headers["Content-Type"] = "application/json"
    headers['Authorization'] = f"Bearer {OPENAI_API_KEY}"

    # Forward the incoming request to OpenAI API with stream enabled
    response = requests.post(
        url=f"{OPENAI_API_BASE}{request.path}",
        headers=headers,
        json=request.json,
        stream=True  # Enable streaming
    )
    
    print(f"Outgoing Request - URL: {response.url}, Status Code: {response.status_code}")

    # Check if the response is a streaming response
    is_streaming_response = 'Transfer-Encoding' in response.headers and response.headers['Transfer-Encoding'] == 'chunked'

    if is_streaming_response:
        print("Streaming response detected")
        # Stream the OpenAI API response back to the client
        def stream_response():
            def generate_chunks():
                for chunk in response.iter_content(chunk_size=1024):
                    yield chunk

            return Response(generate_chunks(), response.status_code, response.headers.items())

        return stream_response()
    else:
        # Return the non-streaming response as a complete JSON object
        return (response.content, response.status_code, response.headers.items())

@app.route('/v1/pdf', methods=['POST', 'OPTIONS'])
def proxy():
    path = "pdf"
    if request.method == 'OPTIONS':
        return optionsResp('POST')

    url = request.json.get('url')
    if url.startswith('/'):
        source = url
    else:
        response = requests.get(url=url)
        source = io.BytesIO(response.content)

    download_name = os.path.basename(url)
    
    return send_file(
        source,
        mimetype='application/pdf',
        as_attachment=True,
        download_name = download_name
    )

@app.route('/opensearch/<path:os_path>', methods=['GET','POST','PUT','DELETE','HEAD','OPTIONS'])
def proxy_opensearch(os_path):
    if request.method == 'OPTIONS':
        return optionsResp('GET, POST, PUT, DELETE, HEAD')
    
    # log = request.method + " " + OPENSEARCH_URL + os_path
    # if request.is_json and request.content_length is not None:
    #     print(request.json)
    #     log += " " + str(request.json)

    response = requests.request(
        method=request.method,
        params=request.args,
        url=OPENSEARCH_URL + os_path,
        json=request.json if (request.is_json and not request.content_length is None) else None,
        headers=request.headers
    )
    # qa_logger.info(log)
    # qa_logger.info(str(response.json()))

    return response.json()


@app.route('/', methods=['GET', 'OPTIONS'])
@app.route('/manifest.json', methods=['GET', 'OPTIONS'])
@app.route('/static/js/bundle.js', methods=['GET', 'OPTIONS'])
@app.route('/viewPdf', methods=['GET', 'OPTIONS'])
@app.route('/favicon.ico', methods=['GET', 'OPTIONS'])
@app.route('/logo_only.png', methods=['GET', 'OPTIONS'])
@app.route('/ArynDemoLogo.png', methods=['GET', 'OPTIONS'])
def proxy_ui():
    if request.method == 'OPTIONS':
        return optionsResp('GET')

    resp = requests.request(
        method=request.method,
        params=request.args,
        url=UI_BASE + request.path,
        headers=request.headers,
    )

    headers = [
        (k, v) for k, v in resp.headers.items()
        if k.lower() not in badHeaders
    ]

    return (resp.content, resp.status_code, headers)


if __name__ == '__main__':
    print(f"Serving on {PORT}...")
    # Use gevent WSGIServer for asynchronous behavior
    http_server = WSGIServer(('0.0.0.0', PORT), app)
    http_server.serve_forever()
