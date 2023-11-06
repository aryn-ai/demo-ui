import React, { useRef, useState, useCallback, useEffect, useContext } from  'react';
import axios from 'axios'
import { useComponentContext } from './output-container';
import { sendInteraction } from './PromptEngineer';
const handleJson = (addOutput, data) => {
    const jsonS = data.replaceAll("data: ", '')
    const jsonObjects = jsonS.split('\n').filter((element) => element !== "" && element.indexOf("[DONE]") === -1);
    const parsedObjects = jsonObjects.map((jsonObject) => {  try {return JSON.parse(jsonObject)
    }catch {console.error("JSON", jsonObject);}})
    var addString = '';
    parsedObjects.forEach((element) => {
    try {
      if(element.choices[0].delta.content !== undefined)
      {
        addString = addString + element.choices[0].delta.content;
      }
      
    } catch (error) {
      console.log(error);
    }
      
      });
    addOutput(addString);
  }
  //TODO: Make this function more readable
  //TODO: implement a way to stop the reader
  //TODO implement setStreaming
  export const handleResponse =  async(reader, setOutput, outputRef, onDone ) =>{
    while(true){
      const{done, value} = await reader.read();
      const data = new TextDecoder().decode(value)
      const handleData = (data) =>{
            handleJson(setOutput, data)
        }
      if(data !== ''){
        handleData(data)
      }
      if(done || data.indexOf("[DONE]") !== -1){
        if(data.indexOf("[DONE]") !== -1){
          onDone(outputRef.current);
          break;
        }

        break;
        
      }
      
    }

  }
  const textSpeed = 3;
/**USELESS CLASS. REPLACED BY RESPONSE CONTAINER 
@deprecated use response container instead
**/
  export const Response = (props) => {
    const { reader, index, setStreaming, query, setConversation } = props;
    const { sharedData, setSharedData } = useComponentContext();
    const outputs = sharedData;
    const setOutputs = setSharedData;
    const output = outputs[index];
    const outputRef = useRef(output);
    const [shown, setShown] = useState('');
    const [done, setDone] = useState(false);
    const [initialDelayCompleted, setInitialDelayCompleted] = useState(false);
    useEffect(() => {
      outputRef.current = output;
      const addOutput = (newOutput) => {
        const helper = (prevOutputs) => {
          let t = [...prevOutputs];
          t[index] = prevOutputs[index] + newOutput;
          return t;
        };
        setSharedData(helper);
      };
  
      const onDone = (output) => {
        sendInteraction(setConversation, query, output);
        setDone(true);
      };
  
      handleResponse(reader, addOutput, outputRef, onDone);
    }, [reader, output, setStreaming, outputs, index, setOutputs, setConversation, query, setSharedData]);

    const updateShown = () => {
      let currentLength = shown.length;
      let targetLength = output.length;
      let timeout;
  
      // Delay equal to query.length * 20 before the character-by-character update starts
      if (!initialDelayCompleted && currentLength < targetLength) {
        timeout = setTimeout(() => {
          setInitialDelayCompleted(true);
        }, query.length * textSpeed);
      } else if (currentLength < targetLength) {
        timeout = setTimeout(() => {
          setShown(output.slice(0, currentLength + 1));
        }, textSpeed); // Adjust the delay (in milliseconds) to control the speed of the update
      }
  
      return () => clearTimeout(timeout);
    }
    updateShown();
  
  
  
    return (
      <pre className='Response'>
        {shown}
        <span id='cursor'>{done ? '' : '_'}</span>
      </pre>
    );
  };
  
  export const RephrasedQuestion = (props) => {
    const [shownQuery, setShownQuery] = useState('');
    const { reader, index, setStreaming, query, setConversation, onDone } = props;
    const { sharedData, setSharedData } = useComponentContext()
    const outputs = sharedData;
    const output = outputs[index];
    const outputRef = useRef(output);
    //console.log(reader, "reader")
    useEffect(() => {
      outputRef.current = output;
      const addOutput = (newOutput) => {
        const helper = (prevOutputs) => {
          let t = [...prevOutputs];
          t[index] = prevOutputs[index] + newOutput;
          return t;
        };
        setSharedData(helper);
      };
      //console.log("useEff")
      handleResponse(reader, addOutput, outputRef, onDone);
    }, [reader, setStreaming, index, setConversation, query, setSharedData, sharedData, shownQuery.length, onDone, output]);
    const updateShown = () => {
      let currentLength = shownQuery.length;
      let targetLength = output.length;
      let timeout;
  
      // Delay equal to query.length * 20 before the character-by-character update starts
    
       if(currentLength < targetLength) {
        timeout = setTimeout(() => {
          setShownQuery(output.slice(0, currentLength + 1));
        }, textSpeed); // Adjust the delay (in milliseconds) to control the speed of the update
      }
      //console.log("updateShown", shownQuery, output)
      return () => clearTimeout(timeout);
    }
    updateShown();
    return <pre className='RephrasedQuestion'>{"Query to knowledgebase :  " +shownQuery}</pre>
  }
  export const Question = ({ query }) => {
    const [shownQuery, setShownQuery] = useState('');
  
    useEffect(() => {
      let currentLength = shownQuery.length;
      let targetLength = query.length;
      let timeout;
  
      if (currentLength < targetLength) {
        timeout = setTimeout(() => {
          setShownQuery(query.slice(0, currentLength + 1));
        }, textSpeed); // Adjust the delay (in milliseconds) to control the speed of the update
      } else {
        setShownQuery(query);
      }
  
      return () => clearTimeout(timeout);
    }, [query, shownQuery]);
  
    return <pre className='Question'>{shownQuery.replace(/\/\/n/g, '/n')}</pre>;
  };
  