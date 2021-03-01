import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth } from 'aws-amplify';
import aws_exports from './aws-exports';
import 'videojs-contrib-eme';
import videojs from 'video.js';

Amplify.configure(aws_exports);

var licenseUri = 'https://license-global.pallycon.com/ri/licenseManager.do';
var widevineToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJzd29uZyIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiS1o2ViIsImhhc2giOiJLejNRUWd5RStGTWY4WUpncUMyZXhiNFdZSFBoOWhCN1FYak1KU3lMTTgwPSIsImNpZCI6Im1lZGlhY29udmVydC10ZXN0LTEiLCJwb2xpY3kiOiJyNUJZSlVzTDhTNk1LZzVlWDRTR05BPT0iLCJ0aW1lc3RhbXAiOiIyMDIxLTAzLTAxVDE5OjI2OjAxWiJ9';
const COMMON_WM_ID = '123';

const getSessionUrl = async (user) => {
    return new Promise((resolve, reject) => {

        fetch('http://localhost:5000/session', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({ wm_id: `${user}.${COMMON_WM_ID}` }),
            success: function(msg) {
                resolve(msg);
            }
        })
        .then((response) => {
            console.log('success! woo')
            response.json().then((data) => resolve(data.session_url));
        });
    });
};

const getUsername = async() => {
    return new Promise((resolve, reject) => {
        Auth.currentSession()
        .then((data) => {
            resolve(data.idToken.payload['cognito:username']);
        }).catch(err => console.log(err));
    });
};

class App extends Component {
    async componentDidMount() {
        const username = await getUsername();
        console.log(username);
        var dashUri = await getSessionUrl(username);
        console.log(dashUri);
        var player = videojs('my-player');
        var parameter = {
            siteId: "KZ6V",
            fontsize: "large",
            opacity: 1,
            interval: 1,
            peakduration: 20,
            positiontype: { fixed: 'righttop' },
            msg: username
        };
        player.ready(function () {
            try {
                player.eme();
                player.trigger("watermarkSetData", parameter);
                let playerConfig = {
                    src: dashUri,
                    type: 'application/dash+xml',
                    keySystems: {
                        'com.widevine.alpha': {
                            url: licenseUri,
                            licenseHeaders: {
                                'pallycon-customdata-v2': widevineToken
                            }
                        }
                    }
                };
                player.src(playerConfig);
            }
            catch(err) {
                console.log(err);
            }
        });
    }

    render() {
        return (
            <div className="App">
                <div className="video">
                    <video id="my-player" className="video-js vjs-default-skin vjs-16-9" playsInline controls data-setup="{}"></video>
                </div>
            </div>
        );
    }
}

export default withAuthenticator(App, true);
