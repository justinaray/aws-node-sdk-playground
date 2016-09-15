#!/usr/bin/env node

'use strict';

/*
TODO: nodemon, request-promise-native
*/

const http = require('http');
const express = require('express');
const AWS = require('aws-sdk');

var argv = require('yargs')
    .usage('Usage: $0 [args]')
    .option('p', {
        alias: 'port',
        default: 8080,
        type: 'number',
        describe: 'The port to listen on'
    })
    .option('aws-profile', {
        alias: 'profile',
        default: undefined,
        type: 'string',
        describe: 'A named profile in .aws/credentials'
    })
    .check(toCheck => {
        if (isNaN(toCheck.port)) {
            throw 'Port must be a number';
        }

        if (typeof toCheck.awsProfile !== 'undefined' && !toCheck.awsProfile) {
            throw 'Profile must not be empty'
        }

        return true;
    })
    .help()
    .argv;

if (argv.awsProfile) {
    var credentials = new AWS.SharedIniFileCredentials({profile: argv.awsProfile});
    AWS.config.credentials = credentials;
}

var s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: 'us-east-1'
});

function listBuckets(req, res) {
    s3.listBuckets(function (err, data) {
        if (err) {
            console.log(err);
            res.append('Content-Type', 'text/plain');
            res.status(500).send('Failed to List Buckets :(');
            return;
        }

        let payload = '<!DOCTYPE html><html><body>';

        payload += '<h1>Current Buckets</h1>';
        if (data && data.Buckets && data.Buckets.length > 0) {
            payload += '<ul>';
            data.Buckets.forEach(currBucket => {
                payload += '<li>' + currBucket.Name + '</li>';
            });
            payload += '</ul>';
        } else {
            payload += 'No Buckets';
        }
        payload += '</body>';

        res.status(200).send(payload);
    });
};

function getMetaData(type) {
    return new Promise((resolve, reject) => {
        let metaDataReq = http.request({
            host: '169.254.169.254',
            path: `/latest/meta-data/${type}`,
            headers: {
                "Accept": "text/plain"
            }
        }, response => {
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(response.statusCode);
            } else {
                let body = '';
                response.setEncoding('utf8');

                response.on('data', function (chunk) {
                    body += chunk;
                });

                response.on('end', () => {
                    resolve(body);
                });
            }
        });

        metaDataReq.on('error', () => reject());

        // Issue the request
        metaDataReq.end();
    });
}

let app = express();

app.get('/', (req, res) => {
    let payload = 'Welcome to my AWS Node SDK Playground';
    payload += '<p>This is a demo of the SDK; not UI, SPA, styling, templating, etc. :)';
    payload += '<br><br>';
    payload += '<br><a href="/buckets">Your Buckets</a>';
    payload += '<br><a href="/publicIpv4">Your Public IP</a>';
    res.send(payload);
});
app.get('/buckets', listBuckets);
app.get('/publicIpv4', (req, res) => {
    getMetaData('public-ipv4').then(result => {
        res.status(200).send(`This instance's public IP is ${result}`);
    }).catch(() => {
        res.status(500).send('Failed to Fetch Public IP v4 :(');
    });
});

// Start up the server
app.listen(argv.port, function() {
    console.log(`Express listening on ${argv.port}`);
});
