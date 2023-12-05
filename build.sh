# Clear build
rm -rf ./build

# Create target directories
mkdir ./build

# Copy main content
cp -r ./content/* ./build

# Copy manifest
cp -r ./manifest.json ./build

cd ./build && zip -r plugin.zip * && cd -