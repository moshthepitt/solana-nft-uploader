# Solana NFT Upload

This is a small utility to upload Solana NFTs to Arweave.

## Motivation

It is meant to be super compatible with the [Metaplex candy machine CLI upload tool](https://github.com/metaplex-foundation/metaplex/tree/master/js/packages/cli).

Why did I build this?  At the time that I wrote this code, the metaplex candy machine cli tool upload command was janky.  It uses a closed source Amazon cloud function as well as sometimes produces images that are blank.

So I decided to build this tool, whose output can be used with the rest of the metaplex commands.

## How to use

1. Clone this repo
2. Install requirements `npm install`
3. Build `npm run build` (optional)
4. View help `node lib/index.js upload --help`
5. Run an upload: `node lib/index.js upload {path to directory containing images} -k {path to location of Arweave wallet file}`

### Using with metaplex candy machine

First, using this tool to upload some images:

```sh
node lib/index.js upload ~/Downloads/images -k ~{path to Arweave key file} -c dragons -e devnet
```

This uploads some images that are located in `~/Downloads/images` to arweave.  It produces a cache file named `devnet-dragons.json`, you can see that by doing:

```sh
ls ls .cache
```

Next you need to copy this cache file into the metaplex candy machine cli directory.  Like so:

```sh
cp .cache/devnet-dragons.json  {path to metaplex directory}/metaplex/js/packages/cli/.cache/devnet-dragons
```

Notice that during the copy we renamed the file to `devnet-dragons` which is more of the format that Metaplex expects.

You now need to navigate into the metaplex cli directory and then run the upload command, like this:

```sh
metaplex upload -e devnet -n 4 -k ~/.config/solana/id.json -c dragons /home/mosh/Downloads/images
```

Or if you don't have metaplex as a command, like this:

```sh
node build/cli.js upload -e devnet -n 4 -k ~/.config/solana/id.json -c dragons ~/Downloads/images
```

Note that:

- the `-c dragons` and `-e devnet` ensure metaplex tries to look for the file named `devnet-dragons` as we expect
- metaplex needs the `-n 4` --> this means the number of images in the directory
- we are pointing metaplex to the same directory that we used before `~/Downloads/images`
- this time around we are using the Solana keyfile `~/.config/solana/id.json`

Metaplex will notice that the images have already been uploaded and will only create the candy machine config and then upload the NFT names and uris to the candy machine.  Metaplex will add something like this to the cache file:

```json
"program": {
    "uuid": "CUKHix",
    "config": "CUKHixZTuTf8M8q8N82VCuoxuJvccHQNaMyVsSeKo4hH"
}
```

You can finally run the metaplex verify command to ensure all is well! :)

```sh
node build/cli.js verify -e devnet -k ~/.config/solana/id.json -c dragons ~/Downloads/images
```

### Notes

- The directory is supposed to contain all the images and JSON files that you intent to upload, named sequentially e.g. 0.png, 0.json, 1.png, 1.json etc
- Unlike the metaplex CLI tool, here you need to have an Arweave wallet that contains funds that you pass to the command (no hidden behind the scenes magic)
- Running the command with the options above will end up with the creation of a file named `.cache/devnet-temp.json` which you can use with the rest of the metaplex CLI commands.  Simply copy it into [this directory](https://github.com/metaplex-foundation/metaplex/tree/master/js/packages/cli) on your local machine and run the metaplex upload command to upload to the candy machine (it should skip uploading to Arweave as that is already done).

### JSON file format

This is the format of the JSON files that should accompany each image that you are trying to upload.

```json
{
    "name": "THE NAME OF THIS NFT e.g. Dragon #01",
    "symbol": "",
    "description": "The description",
    "seller_fee_basis_points": 500,
    "external_url": "https://example.com",
    "attributes": [
        {
            "trait_type": "Name of trait",
            "value": "Value of trait"
        }
    ],
    "collection": {
        "name": "Collection Name",
        "family": "Collection family Name"
    },
    "properties": {
        "files": [
            {
                "uri": "image.png",
                "type": "image/png"
            }
        ],
        "category": "image",
        "maxSupply": 1,
        "creators": [
            {
                "address": "solana address for a creator",
                "share": 100
            }
        ]
    },
    "image": "image.png"
}
```

## Arweave Bundles

This does NOT use Arweave bundles.
