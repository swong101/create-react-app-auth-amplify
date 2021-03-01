import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { withAuthenticator } from 'aws-amplify-react'
import Amplify, { Auth } from 'aws-amplify';
import aws_exports from './aws-exports';
import videojs from 'video.js';
import 'videojs-contrib-eme';

Amplify.configure(aws_exports);

var licenseUri = 'https://license-global.pallycon.com/ri/licenseManager.do';
var widevineToken = 'eyJrZXlfcm90YXRpb24iOmZhbHNlLCJyZXNwb25zZV9mb3JtYXQiOiJvcmlnaW5hbCIsInVzZXJfaWQiOiJzd29uZyIsImRybV90eXBlIjoid2lkZXZpbmUiLCJzaXRlX2lkIjoiS1o2ViIsImhhc2giOiJJNFFkeEhFRGpUSHFRNEVBTkdKXC9RWUQyXC9iY09ITFpPNHV3dU1SeG92WGM9IiwiY2lkIjoibWVkaWFjb252ZXJ0LXRlc3QtMSIsInBvbGljeSI6InI1QllKVXNMOFM2TUtnNWVYNFNHTkE9PSIsInRpbWVzdGFtcCI6IjIwMjEtMDMtMDFUMDU6MjY6MTdaIn0=';
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
        });
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <video id="my-player" className="video-js vjs-default-skin vjs-16-9" playsInline controls data-setup="{}"></video>
                </header>
            </div>
        );
    }
}

export default withAuthenticator(App, true);
