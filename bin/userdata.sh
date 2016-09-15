#!/bin/bash

# System Updates
yum update -y

# SW Installs
yum install git -y

# nvm install
curl https://raw.githubusercontent.com/creationix/nvm/v0.26.1/install.sh | bash
source ~/.nvm/nvm.sh
nvm install v4.5.0

cd ~
mkdir code
cd ~/code
git clone https://github.com/justinaray/aws-node-sdk-playground

cd ~/code/aws-node-sdk-playground
npm install

# Future, auto-start and run levels
