'use strict'

const chalk = require('chalk')

module.exports = async () => chalk`
⚡ I caught the serverless bug

First I started experimenting, then I spent a few weeks building tooling to deploy
existing code to AWS Lambda by changing as little as possible, and it worked well

I did this using {cyanBright https://github.com/JamesKyburz/aws-lambda-http-server}

I have since worked on many projects using serverless on AWS

To name a few things, serverless to me means

{green ●} less time in devops and terraform land and no more patching
{strikethrough {dim ● cheaper (ok everything is relative)}}
{green ●} pay for what you use as a service
{green ●} built in retries for async handlers
{green ●} goodbye cron - scheduling using EventBridge
{green ●} blast radius much smaller
{green ●} function level billing insights (cost allocation tags all the things)
{green ●} cost driven development helps with the correct design choices

I built {cyanBright https://github.com/JamesKyburz/sandbox-debugger}
to allow for interactive debugging
`
