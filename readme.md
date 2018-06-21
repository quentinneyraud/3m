# 3m (Move & Minify Medias)

> Minify images (jpg, png) and rename them following a pattern


## Install

```bash
npm install -g 3m
```

## Usage

`3m [options] < file or glob ... >`
 
### Options



- `-v, --version`  

- `-o, --output-dir <destination directory>`  
Default: `./dist`

- `-p, --pattern <pattern>`   
Set files names, availables patterns : [NAME],[EXT],[INDEX],[DIR_NAME],[INDEX_IN_DIR]  
Default: `[NAME][EXT]`

- `-e, --extensions <extensions>`  
Set extensions  
Default: `jpg,jpeg,png`

- `-r, --recursive`

- `--no-clear`  
Don't clear destination directory  

- `--no-minify`  
Don't minify medias  

- `-h, --help`

## Examples

Given the following structure :  

```
.
├── canada
│   ├── [4.8M]  IMG_20180422_173241.jpg
│   ├── [3.4M]  IMG_20180423_135753.jpg
│   └── [ 37M]  VID_20180221_123547.mp4
├── france
│   ├── [4.3M]  IMG_20180423_143013.jpg
│   ├── [4.1M]  IMG_20180423_143133.jpg
│   └── [3.8M]  IMG_20180423_143339.jpg
└── japan
    ├── [4.0M]  IMG_20180423_141640.jpg
    ├── [4.4M]  IMG_20180423_141759.jpg
    └── [4.7M]  IMG_20180423_142342.jpg
```

#### Minify and move all files to a single directory
 
```sh
3m -r --extensions=jpg,mp4
```

```
.
├── canada
│   ├── [4.8M]  IMG_20180422_173241.jpg
│   ├── [3.4M]  IMG_20180423_135753.jpg
│   └── [ 37M]  VID_20180221_123547.mp4
├── dist
│   ├── [1.2M]  IMG_20180422_173241.jpg
│   ├── [726K]  IMG_20180423_135753.jpg
│   ├── [916K]  IMG_20180423_141640.jpg
│   ├── [1.0M]  IMG_20180423_141759.jpg
│   ├── [1.2M]  IMG_20180423_142342.jpg
│   ├── [1.0M]  IMG_20180423_143013.jpg
│   ├── [1.1M]  IMG_20180423_143133.jpg
│   ├── [975K]  IMG_20180423_143339.jpg
│   └── [ 37M]  VID_20180221_123547.mp4
├── france
│   ├── [4.3M]  IMG_20180423_143013.jpg
│   ├── [4.1M]  IMG_20180423_143133.jpg
│   └── [3.8M]  IMG_20180423_143339.jpg
└── japan
    ├── [4.0M]  IMG_20180423_141640.jpg
    ├── [4.4M]  IMG_20180423_141759.jpg
    └── [4.7M]  IMG_20180423_142342.jpg
```

#### Minify, move and rename all files

```sh
3m -r --extensions=jpg,mp4 --pattern [DIR_NAME]_[INDEX_IN_DIR][EXT]
```

```
.
├── canada
│   ├── [4.8M]  IMG_20180422_173241.jpg
│   ├── [3.4M]  IMG_20180423_135753.jpg
│   └── [ 37M]  VID_20180221_123547.mp4
├── dist
│   ├── [1.2M]  canada_1.jpg
│   ├── [726K]  canada_2.jpg
│   ├── [ 37M]  canada_3.mp4
│   ├── [1.0M]  france_1.jpg
│   ├── [1.1M]  france_2.jpg
│   ├── [975K]  france_3.jpg
│   ├── [916K]  japan_1.jpg
│   ├── [1.0M]  japan_2.jpg
│   └── [1.2M]  japan_3.jpg
├── france
│   ├── [4.3M]  IMG_20180423_143013.jpg
│   ├── [4.1M]  IMG_20180423_143133.jpg
│   └── [3.8M]  IMG_20180423_143339.jpg
└── japan
    ├── [4.0M]  IMG_20180423_141640.jpg
    ├── [4.4M]  IMG_20180423_141759.jpg
    └── [4.7M]  IMG_20180423_142342.jpg
```

#### Minify, move and rename some files/directory

```sh
3m -r --extensions=jpg,mp4 --pattern [DIR_NAME]_[INDEX_IN_DIR][EXT] canada japan/IMG_20180423_141640.jpg france/IMG_20180423_143339.jpg
```

```
.
├── canada
│   ├── [4.8M]  IMG_20180422_173241.jpg
│   ├── [3.4M]  IMG_20180423_135753.jpg
│   └── [ 37M]  VID_20180221_123547.mp4
├── dist
│   ├── [1.2M]  canada_1.jpg
│   ├── [726K]  canada_2.jpg
│   ├── [ 37M]  canada_3.mp4
│   ├── [975K]  france_1.jpg
│   └── [916K]  japan_1.jpg
├── france
│   ├── [4.3M]  IMG_20180423_143013.jpg
│   ├── [4.1M]  IMG_20180423_143133.jpg
│   └── [3.8M]  IMG_20180423_143339.jpg
└── japan
    ├── [4.0M]  IMG_20180423_141640.jpg
    ├── [4.4M]  IMG_20180423_141759.jpg
    └── [4.7M]  IMG_20180423_142342.jpg
```

#### Minify, move and keep the same structure

```sh
3m -r --pattern [PATH]/[NAME][EXT] --extensions=jpg,mp4
```

```
.
├── canada
│   ├── IMG_20180422_173241.jpg
│   ├── IMG_20180423_135753.jpg
│   └── VID_20180424_144512.mp4
├── dist
│   ├── canada
│   │   ├── IMG_20180422_173241.jpg
│   │   ├── IMG_20180423_135753.jpg
│   │   └── VID_20180424_144512.mp4
│   ├── france
│   │   ├── IMG_20180423_143133.jpg
│   │   ├── IMG_20180423_143339.jpg
│   │   └── IMG_20180423_144710.jpg
│   └── japan
│       ├── IMG_20180422_173241.jpg
│       ├── IMG_20180423_135753.jpg
│       └── IMG_20180423_141640.jpg
├── france
│   ├── IMG_20180423_143133.jpg
│   ├── IMG_20180423_143339.jpg
│   └── IMG_20180423_144710.jpg
└── japan
    ├── IMG_20180422_173241.jpg
    ├── IMG_20180423_135753.jpg
    └── IMG_20180423_141640.jpg
```