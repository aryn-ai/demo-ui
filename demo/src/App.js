import React, { useState, useEffect, useRef, createContext, useCallback,  } from 'react';
import './App.css'; // Import the App.css file
import { InputArea } from './InputArea';
import { OutputContainer } from './output-container';
import { DocList } from './DocList';
import ScrollVelocityDetection from './ScrollDetector';
import { SUM_PROMPT } from './PromptEngineer';
import SettingDialog from './SettingDialog';
import PDFViewer from './PDFViewer';
export const port = 3001
const setOutputList = (outputRef, outputList) => {
  outputRef.current.setOutputList(outputList);
};

export const SettingContext = createContext();
function App() {
  //TODO: settings
  const [settings, setSettings] = useState({
    systemprompt: SUM_PROMPT,
    useLLama: false,
    numDocs: 4,
    index: "benchmark-beta-demo",
    OAport : port,
    LLMPort : 8867, 
    textSpeed : 3,
    difficulty : 5,
    max_tokens : 300
  })
  const SettingDialogRef = useRef();
  const [docs, setDocs] = useState([]);
  const [url, setUrl] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [conversation, setConversation] = useState([])
  const [doc, setDoc] = useState('');
//    const setUrl = (url) => {
//        console.log(url)
//        setUrl(url);}

  // const [boxes, setBoxes] =
  const outputRef = useRef();

  var DocListRef = useRef();

  const reset = () => {
    setDocs([]);
    setStreaming(false);
    setConversation([]);
    setUrl('');
    setDoc('');
    outputRef.current.reset()
    DocListRef.current.reset()
  }

  if (doc !== '') {
    console.log(doc.url);
  }
  return (
    <div className="App">
    <SettingContext.Provider value = {{settings, setSettings}}>
      
      <SettingDialog ref={SettingDialogRef}></SettingDialog>
      <div className="open-query">
        {/* Title bar */}
        <div className="title-bar">
          <img src="/arynlogo1.png" alt="Logo" className="logo" />
          <h1>Chatbot Demo</h1>
        </div>
        {/* Input text */}
        <InputArea 
          setDoc = {setDoc}
          setDocs = {setDocs}
          setOutputList={(outputList) => setOutputList(outputRef, outputList)}
          outputRef = {outputRef}
          conversation = {conversation}
          setConversation = {setConversation}
          streaming = {streaming}
          setStreaming = {setStreaming}
          docListRef = {DocListRef}
          SettingDialogRef = {SettingDialogRef}
          ></InputArea>
        {/* Docs */}
        <div className="docs-container">
          <DocList 
          className="document-list"
          docs = {docs}
          setDoc = {setDoc}
          ref = {DocListRef}
          >
          </DocList>
        </div>
      </div>
      <ScrollVelocityDetection className = "chat-responses" reset = {reset}>
          {/* Chat responses */}
          <OutputContainer className = "output-container" ref={outputRef}>
          </OutputContainer>
      </ScrollVelocityDetection>
       <div className="pdf">
       {doc !== '' ?
          <div className = "pdf-viewer">
            <PDFViewer
              pdfURL= {doc.url}
              pdfBoxes = {doc.boxes}
            />
          </div> : null }
      </div>
       </SettingContext.Provider>
      </div>
  );
}

export default App;
