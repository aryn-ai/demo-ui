# demo-ui

A demo-ui to enable conversations on your data. Created using create-react-app. 

Checkout the other .md files for some instructions.

## How to Run

1. Download NODE > 16(npm 9.8.1) from the [website](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or by running `brew to install npm`
2. Download Python
3. Run `npm install` from the project
4. Export OPEN_API_KEY by running  `export OPENAI_API_KEY #####`
5. Run `python openai-proxy/py-back/proxy.py` to bring up the proxy for openAI to use your api key
   - The proxy currently uses 3001, pretty quick switch if you need another port change the port in proxy.py, and then change the port in App.js 
6. Run `npm run build` to build the project
7. Bring up the UI by running `npm start` and navigate to conversational-demo-js/demo
   - If you get a react-scripts not found error, that means your npm isn't updated or you did not run npm install. 
   it should open at localhost:3000

### To run using Docker
```bash
docker build -t demo-ui .
docker run -it -p 3000:3000 -p 3001:3001 -e OPENAI_API_KEY=$OPENAI_API_KEY demo-ui
```

### Note : This UI is intended to be run for demo purposes only.