# Contributing to Audio WebRTC

Thank you for your interest in contributing to this project! This document outlines the process for contributing and the guidelines to follow.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. We expect all contributors to:

- Be respectful and inclusive
- Communicate professionally
- Accept constructive criticism gracefully
- Focus on what is best for the community

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

1. **Bug Description**: Clear explanation of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Browser Information**: Browser, version, and OS
6. **Screenshots**: If applicable

### Suggesting Features

To suggest a new feature:

1. **Feature Description**: Clear explanation of the proposed feature
2. **Use Case**: Why this feature would be useful
3. **Alternative Solutions**: Any alternatives you've considered

### Pull Requests

#### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear, descriptive messages
6. Push to your fork
7. Submit a Pull Request

#### Pull Request Guidelines

- **Keep changes focused**: One feature or fix per pull request
- **Test locally**: Ensure your changes work before submitting
- **Update documentation**: Update README.md if needed
- **Follow existing code style**: Match the project's formatting

## Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/audio-webrtc.git
cd audio-webrtc

# Open in browser or serve locally
# Option 1: Open index.html directly in browser
# Option 2: Use a local server
python -m http.server 8000
# or
npx serve
```

## Coding Standards

- Use semantic HTML
- Follow modern JavaScript (ES6+) patterns
- Keep CSS organized and use CSS custom properties
- Add comments for complex logic
- Use meaningful variable and function names

## Project Structure

```
audio_webrtc/
├── index.html    # Main application (HTML, CSS, JS combined)
├── README.md      # Project documentation
├── LICENSE       # MIT License
└── CONTRIBUTING  # This file
```

## Questions?

If you have questions about contributing, feel free to open an issue for discussion.

## Recognition

Contributors will be acknowledged in the project's README.md (with permission).

---

Thank you for contributing!
