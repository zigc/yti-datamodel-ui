# yti-datamodel-ui

Interoperability workbench data model user interface  

## Prepare tools

`npm install -g yarn`

## Install dependencies

`yarn install`

## Usage
To run the build

    npm start

To make a production build

    NODE_ENV=production npm run-script build

## Installing new npm dependencies

    yard add --save foo-bar-x

## Loading example data
To load example data to a local api/fuseki installation, run

    npm run example-data

To load example data to a custom host and/or port

    npm run example-data -- --host 127.0.0.1 --port 8080

## Updating translation file

    npm run create-translations

Copy new entries from `template.pot` to `po` translation files or use "Update from POT file" if using poedit.

## Architechture
Interoperability user interface is separate one page application that uses data model backend services. Backend design follows restful three layer architecture:

![Alt text](/Technical architecture.jpg "Technical architecture")


Backend:

https://github.com/VRK-YTI/yti-datamodel-api

Database configuration:

https://github.com/VRK-YTI/yti-datamodel-database
