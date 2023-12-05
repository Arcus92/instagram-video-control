# Clear build
rm -rf ./build

# Create target directories
mkdir ./build && mkdir ./build/chrome && mkdir ./build/firefox

# Copy main content
cp -r ./content/* ./build/chrome
cp -r ./content/* ./build/firefox

# Copy manifests
cp -r ./chrome/* ./build/chrome
cp -r ./firefox/* ./build/firefox

cd ./build/chrome && zip -r plugin.zip * && cd -
cd ./build/firefox && zip -r plugin.zip * && cd -