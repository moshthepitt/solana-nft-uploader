#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs_1 = (0, tslib_1.__importDefault)(require("fs"));
const path_1 = (0, tslib_1.__importDefault)(require("path"));
const arweave_1 = (0, tslib_1.__importDefault)(require("arweave"));
const commander_1 = require("commander");
const misc_1 = require("./misc");
commander_1.program.version('0.0.1');
commander_1.program
    .command('upload')
    .argument('<directory>', 'Directory containing images named from 0-n', (val) => val)
    .option('-e, --env <string>', 'Solana cluster env name. One of: mainnet-beta, testnet, devnet', 'devnet')
    .option('-k, --key <path>', `Arweave wallet location`, '--Arweave wallet not provided')
    .option('-c, --cache-name <string>', 'Cache file name', 'temp')
    .action(async (directory, options) => {
    const { key, env, cacheName } = options;
    const arweave = arweave_1.default.init({
        host: misc_1.ARWEAVE_URI,
        port: 443,
        protocol: misc_1.ARWEAVE_PROTOCOL,
        logging: false,
    });
    const jwk = JSON.parse(fs_1.default.readFileSync(key).toString());
    const files = fs_1.default.readdirSync(directory);
    const imageFiles = files.filter((it) => misc_1.EXTENSION_IMAGE.includes(path_1.default.extname(it)));
    const jsonFiles = files.filter((it) => misc_1.EXTENSION_JSON === path_1.default.extname(it));
    const imageFileCount = imageFiles.length;
    const jsonFileCount = jsonFiles.length;
    if (imageFileCount !== jsonFileCount) {
        throw new Error(`number of image files (${imageFileCount}) is different from the number of json files (${jsonFileCount})`);
    }
    const cacheContent = (0, misc_1.loadCache)(cacheName, env);
    const existingMap = new Map(Object.entries(cacheContent.items));
    for (let i = 0; i < imageFileCount; i++) {
        const image = imageFiles[i];
        const imageName = path_1.default.basename(image);
        const index = imageName.replace(path_1.default.extname(imageName), '');
        console.log(`Processing file: ${index}`);
        if (!existingMap.get(index)) {
            console.log(`Uploading image: ${imageName}`);
            const imageType = (0, misc_1.getImageType)(imageName);
            const imageTx = await (0, misc_1.doUpload)(arweave, fs_1.default.readFileSync(path_1.default.join(directory, image)), imageType, jwk, true);
            const imageUri = `${misc_1.ARWEAVE_PROTOCOL}://${misc_1.ARWEAVE_URI}/${imageTx.id}`;
            console.log('Image uploaded to ', imageUri);
            const manifestPath = image.replace(path_1.default.extname(image), '.json');
            console.log(`Uploading manifest: ${manifestPath}`);
            const manifestContent = fs_1.default.readFileSync(path_1.default.join(directory, manifestPath)).toString();
            const manifest = JSON.parse(manifestContent);
            manifest.image = imageUri;
            manifest.properties.files[0].uri = imageUri;
            manifest.properties.files[0].type = imageType;
            const manifestTx = await (0, misc_1.doUpload)(arweave, JSON.stringify(manifest), 'application/json', jwk);
            const mainfestUri = `${misc_1.ARWEAVE_PROTOCOL}://${misc_1.ARWEAVE_URI}/${manifestTx.id}`;
            console.log('Manifest uploaded to ', mainfestUri);
            console.log('Setting cache for ', index);
            cacheContent.items[index] = {
                imageUri,
                link: mainfestUri,
                name: manifest.name,
                onChain: false,
            };
            (0, misc_1.saveCache)(cacheName, env, cacheContent);
            (0, misc_1.sleep)(500);
        }
        else {
            console.log(`Skipping file: ${index}, already exists`);
        }
    }
});
commander_1.program.parse(process.argv);
//# sourceMappingURL=index.js.map