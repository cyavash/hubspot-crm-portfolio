# Video sharing

Deploy index.php under /videos/ on the existing PHP host. Store media and owner credentials outside the public web root. Uploads are limited to the signed-in owner; share URLs use random 128-bit identifiers.

Provision a server-only bootstrap.php returning the SHA-256 hash of a random 256-bit setup key. Visit /videos/?setup=KEY once to let the owner choose their upload password. Never commit the setup key, password, owner.json, or media files. Without a valid bootstrap key or existing owner account, uploading remains disabled.

Supported files: MP4 and WebM, up to 2 GB; 4 MB chunks avoid proxy upload limits. The server requires PHP 8.2+, fileinfo, writable private storage, and at least 50 MB free after each upload. Default total library quota is 20 GB. Uploaded video codecs must be browser-compatible; no transcoding is performed.

Viewer includes native playback, seeking, volume, speed, fullscreen and copy link. No analytics, comments, annotations, public directory or third-party video services.
