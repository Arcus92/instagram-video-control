const fs = require('node:fs');
const archiver = require('archiver');
const path = require('path');
const childProcess = require('child_process');

const distPath = path.join(__dirname, 'dist');
const sourcePath = path.join(__dirname, 'dist', 'js');
const staticPath = path.join(__dirname, 'content', 'static');

// Getting the version from the package.json
const versionBuffer = childProcess.execSync("npm pkg get version --parseable", { encoding: 'utf8' });
const version = JSON.parse(versionBuffer);
console.log(`Packing version: ${version}`);

const platformNames = ['firefox', 'chrome'];
for (const platformName of platformNames) {
    console.log(`Packing plugin for ${platformName}...`);
    const platformDistPath = path.join(distPath, platformName);
    const platformDistManifestPath = path.join(distPath, platformName, 'manifest.json');
    const platformManifestPath = path.join(__dirname, 'content', 'manifest', `${platformName}.json`);
    const platformZipPath = path.join(distPath, platformName + '.zip');

    // Clear output directory
    fs.rmSync(platformDistPath, { recursive: true, force: true });
    fs.mkdirSync(platformDistPath);
    if (fs.existsSync(platformZipPath)) {
        fs.rmSync(platformZipPath);
    }

    // Copy content. TypeScript must be compiled by now.
    fs.cpSync(staticPath, platformDistPath, { recursive: true });
    fs.cpSync(sourcePath, platformDistPath, { recursive: true });

    // Copy manifest and replacing the version.
    let manifest = fs.readFileSync(platformManifestPath, 'utf8');
    manifest = manifest.replace('{VERSION}', version);
    fs.writeFileSync(platformDistManifestPath, manifest);

    // Creating zip file from plugin.
    const zip = archiver('zip', {  });
    const output = fs.createWriteStream(platformZipPath);

    zip.directory(platformDistPath, false);

    zip.pipe(output);
    zip.finalize().then(() => {
        console.log(`Zip file created: ${platformZipPath}`);
    });
}