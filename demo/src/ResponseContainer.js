import React, { useRef, useEffect, useState, useContext } from "react";
import { handleResponse } from "./Response";
import { useComponentContext } from './output-container';
import { sendInteraction } from "./PromptEngineer";
import './styles/ResponseContainer.css';
import { SettingContext } from "./App";
function useForceUpdate(){
    const [value, setValue] = useState(0); // integer state
    return () => setValue(value => value + 1); // update state to force render
    // A function that increment 👆🏻 the previous state like here 
    // is better than directly setting `setValue(value + 1)`
}


/**
 * A helpful class that handles the responses from any amount of LLMs and displays them in a container
 * @param {reader, names, query, setConversation} props 
 * @returns a container of responses that can be switched between
 */
export const ResponseContainer = (props) => {
    const { readers, names, query, setConversation } = props;
    const [index, setIndex] = useState(0);
    const { sharedData, setSharedData } = useComponentContext();
    const outputs = useRef(names.map(() => ''));
    const [outputState, setOutputState] = useState(outputs.current);
    const [done, setDone] = useState(names.map(() => false));
    const [shown, setShown] = useState(names.map(() => ''));
    const [initialDelayCompleted, setInitialDelayCompleted] = useState(names.map(() => false));
    const [finishedShow, setFinishedShow] = useState(names.map(() => false));
    const [chosen, setChosen] = useState(undefined);
    const {settings, setSettings} = useContext(SettingContext);
    useEffect(() => {
        
        const addOutput = (newOutput, i) => {
            outputs.current[i] = outputs.current[i] + newOutput;
            setOutputState(outputs.current);
        };
        const onDone = (output, i) => {
            setDone((prevDone) => {
                let t = [...prevDone];
                t[i] = true;
                return t;
            });
        }
        const handlers = readers.map((reader, i) => {
            handleResponse(reader, ((newOutput) => addOutput(newOutput, i)), outputs, ((output) => onDone(output, i)), i);
        });
        Promise.allSettled(handlers).then(() => {
            console.log("promised settled");
        })
    }, [readers, index, outputs, setSharedData, setConversation, query, setOutputState]);
    const textSpeed = settings.textSpeed;


    const setFinishedShowI = (newV, i) => {
        setFinishedShow((prev) => {
            let t = [...prev];
            t[i] = newV;
            return t;
        });
    }
    useEffect(() => {
        console.log(chosen, settings.useLLama, "chosen")
        if(!settings.useLLama && chosen === false){
            const choose = () => {sendInteraction(setConversation, query, outputs.current[index]); setChosen(true)}
            choose();
        }}
    ,[chosen, settings.useLLama])

    const setShownI = (newShown, i) => {
        setShown((prevShown) => {
            let t = [...prevShown];
            t[i] = newShown;
            return t;
        });
    }
    const updateShown = (output, i) => {
        let currentLength = shown[i].length;
        let targetLength = output.length;
        let timeout;
        if(outputState !== outputs.current){
            console.warn("outputState error")
        }

        // Delay equal to query.length * 20 before the character-by-character update starts
        if (!initialDelayCompleted[i] && currentLength < targetLength) {
            timeout = setTimeout(() => {
            setInitialDelayCompleted((prevInitialDelayCompleted) => {
                let t = [...prevInitialDelayCompleted];
                t[i] = true;
                return t;
                });
            }, query.length * textSpeed);
        } else if (currentLength < targetLength) {
            timeout = setTimeout(() => {
            setShownI(output.slice(0, currentLength + 1), i);
            }, textSpeed); // Adjust the delay (in milliseconds) to control the speed of the update
        } else if(currentLength === targetLength && done[i] && !finishedShow[i]){
            setFinishedShowI(true, i);
            setChosen(false)
        }
    
        return () => clearTimeout(timeout);
        }
outputs.current.forEach((output, i) => {
    // console.log(output, i)
    updateShown(output, i);
});
const render = useForceUpdate();
useEffect(() => {
    render();
    console.log("rendered")
}, [outputs.current]);











        return (
            <div className="ResponseManager" style={{display: chosen ? 'flex' : 'grid', gridTemplateColumns:' .2fr 1fr' }}>
                {!chosen && (
                    <div className="modelTabs">
                        {names.map((name, i) => {
                        return <button onClick={() => setIndex(i)} key={i} >{name}</button>;
                        })}
                    </div>
                    )}
                <pre className="Response" >
                            {shown[index]}
                    <span id='cursor'>{done[index] ? '' : '_'}</span>
                    {finishedShow[index] && !chosen? <button onClick = {() => {sendInteraction(setConversation, query, outputs.current[index]); setChosen(true)}} className="choose"> Choose </button> : null}
                </pre>
            </div>
        )
    }
