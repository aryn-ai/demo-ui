# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### 'python proxy.py' will start the proxy server to keep the openai key out of the code. make sure to export an openai key in the directory before you run it. Also make sure to port forward to the opensearch cluster. 

Changable constants within the code
difficulty in ScrollDetector : higher difficulty means harder to trigger the reset event. should typically stay within the 3 - 7 range, since unknown difficulty levels could make it impossible

textSpeed in Response : how many ms before next char is shown. If you see the cursor dissapear before the text is finished, maybe decrease this value since the cursor indicates that the api is still streaming. 

numDocs in DocList : how many docs you put into the LLM context. 
