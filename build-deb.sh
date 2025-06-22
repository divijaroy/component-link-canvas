#!/bin/bash

# Build script for Netra Debian package

set -e

echo "Building Netra Debian package..."

# Check if we're in a Debian environment
if ! command -v dpkg-buildpackage &> /dev/null; then
    echo "Error: dpkg-buildpackage not found. Please install build-essential and devscripts:"
    echo "sudo apt-get install build-essential devscripts"
    exit 1
fi

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf debian/netra
rm -f ../netra_*.deb
rm -f ../netra_*.dsc
rm -f ../netra_*.tar.gz
rm -f ../netra_*.buildinfo
rm -f ../netra_*.changes

# Build the package
echo "Building package..."
dpkg-buildpackage -b -us -uc

echo "Build completed successfully!"
echo "Package files created in parent directory:"
ls -la ../netra_*

echo ""
echo "To install the package:"
echo "sudo dpkg -i ../netra_*.deb"
echo "sudo apt-get install -f  # Install any missing dependencies" 