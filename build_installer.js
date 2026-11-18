const path = require('path');
const builder = require('electron-builder');

console.log('Starting local Windows build for v1.1.85...');
builder.build({
    targets: builder.Platform.WINDOWS.createTarget(),
    publish: 'never'
}).then((res) => {
    console.log('BUILD SUCCESS! Created files:', res);
}).catch((err) => {
    console.error('BUILD FAILED:', err);
    process.exit(1);
});
