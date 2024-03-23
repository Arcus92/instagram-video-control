# Clear build
rm -rf ./dist

# Create target directories
mkdir ./dist && mkdir ./dist/chrome && mkdir ./dist/firefox

# Compile to JavaScript
npm run tsc

# Copy JavaScript
cp -r ./dist/js/* ./dist/chrome
cp -r ./dist/js/* ./dist/firefox

# Copy main content
cp -r ./content/* ./dist/chrome
cp -r ./content/* ./dist/firefox

# Copy manifests
cp -r ./chrome/* ./dist/chrome/
cp -r ./firefox/* ./dist/firefox/

cd ./dist/chrome && zip -r plugin.zip * && cd -
cd ./dist/firefox && zip -r plugin.zip * && cd -