#!/bin/bash

# FFmpeg Installation Script for Text Rendering Support
# This script installs FFmpeg with necessary text rendering libraries

echo "🚀 FFmpeg Text Rendering Setup Script"
echo "======================================"

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="windows"
else
    OS="unknown"
fi

echo "📱 Detected OS: $OS"

# Function to install on macOS
install_macos() {
    echo "🍎 Installing FFmpeg on macOS..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    echo "🔄 Updating Homebrew..."
    brew update
    
    echo "📦 Installing FFmpeg with text rendering support..."
    brew install ffmpeg
    
    echo "🎨 Installing additional font libraries..."
    brew install freetype harfbuzz fribidi
    
    echo "✅ macOS installation complete!"
}

# Function to install on Linux
install_linux() {
    echo "🐧 Installing FFmpeg on Linux..."
    
    # Detect Linux distribution
    if command -v apt-get &> /dev/null; then
        echo "📦 Using apt package manager (Ubuntu/Debian)..."
        sudo apt update
        sudo apt install -y ffmpeg libfreetype6-dev libharfbuzz-dev libfribidi-dev
        sudo apt install -y fontconfig fonts-noto-color-emoji
        
    elif command -v yum &> /dev/null; then
        echo "📦 Using yum package manager (CentOS/RHEL)..."
        sudo yum install -y epel-release
        sudo yum install -y ffmpeg freetype-devel harfbuzz-devel fribidi-devel
        sudo yum install -y fontconfig google-noto-emoji-fonts
        
    elif command -v dnf &> /dev/null; then
        echo "📦 Using dnf package manager (Fedora)..."
        sudo dnf install -y ffmpeg freetype-devel harfbuzz-devel fribidi-devel
        sudo dnf install -y fontconfig google-noto-emoji-fonts
        
    elif command -v pacman &> /dev/null; then
        echo "📦 Using pacman package manager (Arch Linux)..."
        sudo pacman -S --noconfirm ffmpeg freetype2 harfbuzz fribidi
        sudo pacman -S --noconfirm fontconfig noto-fonts-emoji
        
    else
        echo "❌ Unknown Linux distribution. Please install manually:"
        echo "   Required packages: ffmpeg, freetype, harfbuzz, fribidi"
        exit 1
    fi
    
    echo "✅ Linux installation complete!"
}

# Function to install on Windows
install_windows() {
    echo "🪟 Windows Installation Instructions:"
    echo ""
    echo "📋 Option 1: Using Chocolatey (Recommended)"
    echo "   choco install ffmpeg"
    echo ""
    echo "📋 Option 2: Using Winget"
    echo "   winget install ffmpeg"
    echo ""
    echo "📋 Option 3: Manual Installation"
    echo "   1. Download FFmpeg from: https://ffmpeg.org/download.html"
    echo "   2. Choose a build that includes text rendering libraries"
    echo "   3. Extract to C:\\ffmpeg"
    echo "   4. Add C:\\ffmpeg\\bin to your PATH"
    echo ""
    echo "🔧 Required libraries for text rendering:"
    echo "   - libfreetype (text rendering)"
    echo "   - libharfbuzz (text shaping)"
    echo "   - libfribidi (bidirectional text)"
    echo ""
    echo "ℹ️  This script cannot automatically install on Windows."
    echo "    Please follow the manual instructions above."
}

# Function to verify installation
verify_installation() {
    echo ""
    echo "🔍 Verifying FFmpeg installation..."
    
    if command -v ffmpeg &> /dev/null; then
        echo "✅ FFmpeg is installed"
        
        # Check version
        FFMPEG_VERSION=$(ffmpeg -version 2>&1 | head -n 1)
        echo "📋 Version: $FFMPEG_VERSION"
        
        # Check for text rendering libraries
        echo "🔍 Checking text rendering capabilities..."
        
        FFMPEG_CONFIG=$(ffmpeg -version 2>&1)
        
        if echo "$FFMPEG_CONFIG" | grep -q "libfreetype"; then
            echo "✅ libfreetype: Available"
        else
            echo "❌ libfreetype: Missing"
        fi
        
        if echo "$FFMPEG_CONFIG" | grep -q "libharfbuzz"; then
            echo "✅ libharfbuzz: Available"
        else
            echo "❌ libharfbuzz: Missing"
        fi
        
        if echo "$FFMPEG_CONFIG" | grep -q "libfribidi"; then
            echo "✅ libfribidi: Available"
        else
            echo "❌ libfribidi: Missing"
        fi
        
        echo ""
        echo "🎉 Installation verification complete!"
        echo "🔧 You can now use the .stext command with emoji support"
        
    else
        echo "❌ FFmpeg not found in PATH"
        echo "   Please check your installation and PATH configuration"
        exit 1
    fi
}

# Main installation logic
echo ""
case $OS in
    "macos")
        install_macos
        ;;
    "linux")
        install_linux
        ;;
    "windows")
        install_windows
        exit 0
        ;;
    *)
        echo "❌ Unsupported operating system: $OSTYPE"
        echo "   Please install FFmpeg manually with text rendering support"
        exit 1
        ;;
esac

# Verify installation
verify_installation

echo ""
echo "🎨 Next steps:"
echo "1. Test the installation with: .ffmpeg (in your bot)"
echo "2. Create text stickers with: .stext Hello 🌍"
echo "3. Use different styles: .stext meme: Your text here"
echo ""
echo "📚 For more help, use: .stext (without arguments)"
