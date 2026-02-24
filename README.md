# Audio WebRTC Stream

A browser-based WebRTC audio streaming application supporting low-latency WHIP (WebRTC-HTTP Ingestion Protocol) for publishing and WHEP (WebRTC-HTTP Egress Protocol) for playback.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![HTML](https://img.shields.io/badge/HTML5-CSS3-orange)
![JavaScript](https://img.shields.io/badge/ES6+-yellow)

## Features

- **WHIP Publishing**: Publish audio streams from your microphone to a WebRTC endpoint
- **WHEP Playback**: Receive and play audio streams via WHEP protocol
- **Real-time Audio Visualization**: See audio waveforms for both input and output
- **Live Statistics**: Monitor ICE connection state, codec, bitrate, and jitter
- **Event Logging**: Full diagnostic logging with timestamps

## Requirements

- A modern web browser with WebRTC support (Chrome, Firefox, Edge, Safari)
- A WebRTC server that supports WHIP/WHEP protocols (e.g., MediaServerX, LiveKit,Owlime)
- Microphone access (for publishing)

## Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/audio-webrtc.git
   cd audio-webrtc
   ```

2. Open `index.html` in your browser, or serve it locally:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   ```

3. Configure your WebRTC server URLs:
   - **Publish URL**: Enter your WHIP endpoint (e.g., `https://your-server.com/webrtc/publish/stream-id`)
   - **Playback URL**: Enter your WHEP endpoint (e.g., `https://your-server.com/webrtc/play/stream-id`)

4. Click **Start Publishing** to begin streaming from your microphone, or **Start Playback** to listen to a stream.

## Usage

### Publishing Audio

1. Grant microphone permission when prompted
2. Enter your WHIP publish URL in the input field
3. Click **Start Publishing**
4. The audio visualizer will show your microphone input in real-time
5. Use **Stop** to end the stream

### Playing Audio

1. Enter your WHEP playback URL in the input field
2. Click **Start Playback**
3. The audio will begin playing through your speakers
4. Use **Stop** to end playback

## Configuration

The application requires a WebRTC server that implements the WHIP/WHEP protocols. Some compatible servers include:

- [MediaServerX](https://github.com/mediaserverx/mediaserverx)
- [LiveKit](https://livekit.io/)
- [Owlime](https://github.com/nicokempe/owlime)
- [ mediasoup](https://mediasoup.org/)

### Expected Server Endpoints

- **WHIP Publish**: `POST` to create a publisher session
- **WHEP Playback**: `POST` to create a subscriber session

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome  | 76+            |
| Firefox | 75+            |
| Safari  | 14.1+          |
| Edge    | 79+            |

## Project Structure

```
audio_webrtc/
├── index.html          # Main application
├── README.md           # This file
├── LICENSE             # MIT License
├── CONTRIBUTING.md     # Contribution guidelines
├── .gitignore          # Git ignore rules
└── package.json        # NPM package configuration
```

## Development

To set up a development environment:

```bash
# Install dependencies (if using Node.js tools)
npm install

# Make changes to the source files
# - HTML: index.html
# - CSS:  Embedded in index.html
# - JS:   Embedded in index.html
```

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Ways to Contribute

- Report bugs and issues
- Suggest new features
- Improve documentation
- Submit code improvements
- Share feedback

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [WebRTC](https://webrtc.org/) for the real-time communication protocol
- [WHIP](https://www.ietf.org/doc/html/draft-ietf-wish-whip) specification
- [WHEP](https://www.ietf.org/doc/html/draft-ietf-wish-whep) specification
