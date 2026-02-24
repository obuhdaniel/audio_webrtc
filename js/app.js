/**
 * Audio WebRTC Stream - JavaScript Application
 * Supports WHIP publishing and WHEP playback
 */

// ─────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────
function log(msg, type = 'info') {
  const el = document.getElementById('logScroll');
  const now = new Date().toISOString().slice(11, 23);
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.innerHTML = `<span class="ts">${now}</span><span class="msg">${msg}</span>`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
  console.log(`[${type}] ${msg}`);
}

// ─────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────
function setStatus(id, msg, cls = '') {
  const el = document.getElementById(id);
  el.className = 'status-bar ' + cls;
  el.innerHTML = cls === 'connected' || cls === 'receiving'
    ? `<span class="pulse-dot"></span>${msg}`
    : msg;
}

// ─────────────────────────────────────────────
// Audio Visualizer
// ─────────────────────────────────────────────
function startVisualizer(stream, canvasId, accentColor = '#00e5a0') {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.75;
  source.connect(analyser);
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  let rafId;

  function draw() {
    rafId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, W, H);

    const barW = (W / bufferLength) * 2.2;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barH = (dataArray[i] / 255) * H;
      const alpha = 0.4 + (dataArray[i] / 255) * 0.6;
      ctx.fillStyle = accentColor + Math.round(alpha * 255).toString(16).padStart(2,'0');
      ctx.beginPath();
      ctx.roundRect(x, H - barH, barW - 1, barH, 2);
      ctx.fill();
      x += barW;
    }
  }
  draw();

  return () => {
    cancelAnimationFrame(rafId);
    audioCtx.close();
  };
}

// ─────────────────────────────────────────────
// ICE config — optimized for low latency
// ─────────────────────────────────────────────
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

// ─────────────────────────────────────────────
// PUBLISH
// ─────────────────────────────────────────────
let pubPc = null, pubStream = null, stopPubViz = null, pubStatsTimer = null;

document.getElementById('btnPublish').onclick = async () => {
  const url = document.getElementById('publishUrl').value.trim();
  if (!url) { setStatus('pubStatus', '⚠ Paste a publish URL first', 'warning'); return; }

  document.getElementById('btnPublish').disabled = true;
  setStatus('pubStatus', 'Requesting microphone access…');
  log('Requesting microphone…');

  try {
    pubStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 48000 },
        channelCount: { ideal: 1 }
      },
      video: false
    });

    log('Microphone acquired', 'ok');
    document.getElementById('pubVizWrap').style.display = '';
    document.getElementById('pubStats').style.display = '';
    stopPubViz = startVisualizer(pubStream, 'pubCanvas', '#00e5a0');

    pubPc = new RTCPeerConnection(ICE_CONFIG);

    pubPc.oniceconnectionstatechange = () => {
      const s = pubPc.iceConnectionState;
      document.getElementById('pubIceState').textContent = s;
      log(`Publish ICE → ${s}`, s === 'connected' ? 'ok' : s === 'failed' ? 'err' : 'info');
      if (s === 'connected') {
        setStatus('pubStatus', '🟢 Stream is LIVE', 'connected');
        startPubStats();
      } else if (s === 'failed' || s === 'disconnected') {
        setStatus('pubStatus', `❌ ICE ${s}`, 'error');
      }
    };

    pubPc.onicegatheringstatechange = () => {
      log(`Publish ICE gathering → ${pubPc.iceGatheringState}`);
    };

    // Add audio track — force Opus codec for low latency
    pubStream.getAudioTracks().forEach(t => pubPc.addTrack(t, pubStream));

    const offer = await pubPc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false
    });

    // Prefer Opus with low-latency settings in SDP
    offer.sdp = preferOpus(offer.sdp);
    await pubPc.setLocalDescription(offer);

    setStatus('pubStatus', 'Gathering ICE candidates…');
    log('Waiting for ICE gathering…');

    // Trickle-ice wait — up to 2s or complete
    await waitForIce(pubPc, 2000);

    log(`Sending offer to: ${url}`);
    setStatus('pubStatus', 'Sending offer to server…');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'Accept': 'application/sdp'
      },
      body: pubPc.localDescription.sdp
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Server ${res.status}: ${txt.slice(0, 200)}`);
    }

    const answerSdp = await res.text();
    log(`Answer received (${answerSdp.length} bytes)`);

    await pubPc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    setStatus('pubStatus', 'Connecting…');
    document.getElementById('btnStopPublish').disabled = false;

    // Detect codec from SDP
    const codec = detectAudioCodec(answerSdp);
    document.getElementById('pubCodec').textContent = codec;
    log(`Negotiated codec: ${codec}`, 'ok');

  } catch (err) {
    log('Publish error: ' + err.message, 'err');
    setStatus('pubStatus', '❌ ' + err.message, 'error');
    teardownPublish();
    document.getElementById('btnPublish').disabled = false;
  }
};

document.getElementById('btnStopPublish').onclick = () => {
  log('Stopping publish stream…', 'warn');
  teardownPublish();
  setStatus('pubStatus', 'Stopped');
  document.getElementById('btnPublish').disabled = false;
  document.getElementById('btnStopPublish').disabled = true;
};

function teardownPublish() {
  if (pubPc) { pubPc.close(); pubPc = null; }
  if (pubStream) { pubStream.getTracks().forEach(t => t.stop()); pubStream = null; }
  if (stopPubViz) { stopPubViz(); stopPubViz = null; }
  if (pubStatsTimer) { clearInterval(pubStatsTimer); pubStatsTimer = null; }
  document.getElementById('pubVizWrap').style.display = 'none';
  document.getElementById('pubStats').style.display = 'none';
  document.getElementById('pubBitrate').textContent = '—';
  document.getElementById('pubIceState').textContent = '—';
}

async function startPubStats() {
  let lastBytes = 0, lastTs = 0;
  pubStatsTimer = setInterval(async () => {
    if (!pubPc) return;
    const stats = await pubPc.getStats();
    stats.forEach(r => {
      if (r.type === 'outbound-rtp' && r.kind === 'audio') {
        const now = r.timestamp;
        const bytes = r.bytesSent;
        if (lastTs) {
          const dt = (now - lastTs) / 1000;
          const kbps = Math.round(((bytes - lastBytes) * 8) / dt / 1000);
          document.getElementById('pubBitrate').textContent = kbps + ' kbps';
        }
        lastBytes = bytes; lastTs = now;
      }
    });
  }, 1500);
}

// ─────────────────────────────────────────────
// PLAYBACK
// ─────────────────────────────────────────────
let playPc = null, stopPlayViz = null, playStatsTimer = null;

document.getElementById('btnPlay').onclick = async () => {
  const url = document.getElementById('playbackUrl').value.trim();
  if (!url) { setStatus('playStatus', '⚠ Paste a playback URL first', 'warning'); return; }

  document.getElementById('btnPlay').disabled = true;
  setStatus('playStatus', 'Creating peer connection…');
  log('Starting playback…');

  try {
    playPc = new RTCPeerConnection(ICE_CONFIG);

    playPc.oniceconnectionstatechange = () => {
      const s = playPc.iceConnectionState;
      document.getElementById('playIceState').textContent = s;
      log(`Playback ICE → ${s}`, s === 'connected' ? 'ok' : s === 'failed' ? 'err' : 'info');
      if (s === 'failed' || s === 'disconnected') {
        setStatus('playStatus', `❌ ICE ${s}`, 'error');
      }
    };

    // WHEP: add recvonly transceiver
    playPc.addTransceiver('audio', { direction: 'recvonly' });

    playPc.ontrack = (e) => {
      log('Remote track received: ' + e.track.kind, 'ok');
      const audio = document.getElementById('remoteAudio');
      audio.srcObject = e.streams[0];

      // Visualize incoming audio
      document.getElementById('playVizWrap').style.display = '';
      document.getElementById('playStats').style.display = '';

      // We need AudioContext on a stream — use the MediaStream from the track
      stopPlayViz = startVisualizer(e.streams[0], 'playCanvas', '#5b8aff');

      setStatus('playStatus', '🔵 Receiving audio', 'receiving');
      startPlayStats();
    };

    const offer = await playPc.createOffer();
    await playPc.setLocalDescription(offer);

    setStatus('playStatus', 'Gathering ICE…');
    await waitForIce(playPc, 2000);

    log(`Sending WHEP offer to: ${url}`);
    setStatus('playStatus', 'Sending request…');

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
        'Accept': 'application/sdp'
      },
      body: playPc.localDescription.sdp
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Server ${res.status}: ${txt.slice(0, 200)}`);
    }

    const answerSdp = await res.text();
    log(`Playback answer received (${answerSdp.length} bytes)`);

    await playPc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    const codec = detectAudioCodec(answerSdp);
    document.getElementById('playCodec').textContent = codec;
    log(`Playback codec: ${codec}`, 'ok');

    setStatus('playStatus', 'Negotiating…');
    document.getElementById('btnStopPlay').disabled = false;

  } catch (err) {
    log('Playback error: ' + err.message, 'err');
    setStatus('playStatus', '❌ ' + err.message, 'error');
    teardownPlayback();
    document.getElementById('btnPlay').disabled = false;
  }
};

document.getElementById('btnStopPlay').onclick = () => {
  log('Stopping playback…', 'warn');
  teardownPlayback();
  setStatus('playStatus', 'Stopped');
  document.getElementById('btnPlay').disabled = false;
  document.getElementById('btnStopPlay').disabled = true;
};

function teardownPlayback() {
  if (playPc) { playPc.close(); playPc = null; }
  if (stopPlayViz) { stopPlayViz(); stopPlayViz = null; }
  if (playStatsTimer) { clearInterval(playStatsTimer); playStatsTimer = null; }
  document.getElementById('remoteAudio').srcObject = null;
  document.getElementById('playVizWrap').style.display = 'none';
  document.getElementById('playStats').style.display = 'none';
  document.getElementById('playIceState').textContent = '—';
  document.getElementById('playCodec').textContent = '—';
  document.getElementById('playJitter').textContent = '—';
}

async function startPlayStats() {
  playStatsTimer = setInterval(async () => {
    if (!playPc) return;
    const stats = await playPc.getStats();
    stats.forEach(r => {
      if (r.type === 'inbound-rtp' && r.kind === 'audio') {
        const jitter = r.jitter != null ? (r.jitter * 1000).toFixed(1) + ' ms' : '—';
        document.getElementById('playJitter').textContent = jitter;
      }
    });
  }, 1500);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

// Wait for ICE gathering to complete or timeout
function waitForIce(pc, maxMs = 2000) {
  return new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') { resolve(); return; }
    const timeout = setTimeout(resolve, maxMs);
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timeout);
        resolve();
      }
    };
    pc.onicecandidate = e => {
      if (!e.candidate) { clearTimeout(timeout); resolve(); }
    };
  });
}

// Prefer Opus codec in SDP — sets maxaveragebitrate and enables cbr for lower latency
function preferOpus(sdp) {
  // Find Opus payload type
  const match = sdp.match(/a=rtpmap:(\d+) opus\/48000\/2/i);
  if (!match) return sdp;
  const pt = match[1];

  // Inject or replace fmtp for Opus
  const opusFmtp = `a=fmtp:${pt} minptime=10;useinbandfec=1;stereo=0;maxaveragebitrate=96000`;

  if (sdp.includes(`a=fmtp:${pt} `)) {
    return sdp.replace(new RegExp(`a=fmtp:${pt} [^\r\n]+`), opusFmtp);
  } else {
    return sdp.replace(
      new RegExp(`(a=rtpmap:${pt} opus[^\r\n]+\r?\n)`),
      `$1${opusFmtp}\r\n`
    );
  }
}

// Pull codec name from SDP
function detectAudioCodec(sdp) {
  const m = sdp.match(/a=rtpmap:\d+ ([A-Za-z0-9]+)\/\d+/);
  return m ? m[1].toUpperCase() : 'unknown';
}

// Initialize application
log('Audio WebRTC tool ready', 'ok');
