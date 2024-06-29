from flask import Flask, request, jsonify, send_file, send_from_directory
from pytube import YouTube
import io

app = Flask(__name__)

@app.route('/')
def serve_frontend():
    return send_from_directory('static', 'index.html')

@app.route('/api/video-info', methods=['POST'])
def get_video_info():
    data = request.json
    url = data.get('url')
    try:
        yt = YouTube(url)
        streams = [
            {
                'itag': stream.itag,
                'resolution': stream.resolution,
                'mime_type': stream.mime_type,
                'abr': stream.abr,
                'filesize': stream.filesize
            }
            for stream in yt.streams.filter(progressive=True)
        ]
        return jsonify({'streams': streams})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/download', methods=['POST'])
def download_video():
    data = request.json
    url = data.get('url')
    itag = data.get('itag')
    try:
        yt = YouTube(url)
        stream = yt.streams.get_by_itag(itag)
        buffer = io.BytesIO()
        stream.stream_to_buffer(buffer)
        buffer.seek(0)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{yt.title}.mp4",
            mimetype='video/mp4'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
