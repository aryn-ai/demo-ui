import React, { useContext, forwardRef, useImperativeHandle, useState, useRef } from 'react';
import { SettingContext } from './App';
import './styles/Settings.css';
const SettingDialog = forwardRef((props, ref) => {
  const { settings, setSettings } = useContext(SettingContext);
  const [formData, setFormData] = useState(settings);
  const settingRef = useRef();
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const newSettings = {
      systemprompt: data.get('systemprompt'),
      useLLama: data.get('useLLama'),
      numDocs: data.get('numDocs'),
      index: data.get('index'),
      OAport: data.get('OAport'),
      LLMPort: data.get('LLMPort'),
      textSpeed: data.get('textSpeed'),
      difficulty: data.get('difficulty'),
      max_tokens: data.get("max_tokens")
    };
    setSettings(newSettings);
    ref.current.close();
  };
 const handleChangeNum = (event) => {
  const newFormData = {...formData};
  //replace any non-numerical characters with nothing
  newFormData[event.target.name]= event.target.value.replace(/\D/g,'');
  setFormData(newFormData);
 }
 const handleChangeText = (event) => {
    const newFormData = {...formData};
    newFormData[event.target.name]= event.target.value;
    setFormData(newFormData);
  }

  useImperativeHandle(ref, () => ({
    
    show: () => {
      const dialog = settingRef.current;
      console.log(dialog.open); // should be false
      dialog.showModal();
      console.log(dialog.open); // should be true
    },
    close: () => {
      const dialog = settingRef.current;
      console.log(dialog.open); // should be true
      dialog.close();
      console.log(dialog.open); // should be false
    }
  }));

  return (
    <dialog className='settings' open = {false} ref = {settingRef}>
      <h1>Settings</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="systemprompt">System Prompt</label>
        <input type="text" id="systemprompt" name="systemprompt" value={formData.systemprompt} onChange = {handleChangeText} />
        <label htmlFor="useLLama">Use LLama</label>
        <input type="checkbox" id="useLLama" name="useLLama" value={formData.useLLama} onChange = {handleChangeText}/>
        <label htmlFor="numDocs">Number of Documents</label>
        <input type="number" id="numDocs" name="numDocs" value={formData.numDocs} onChange = {handleChangeNum} />
        <label htmlFor="index">Index</label>
        <input type="text" id="index" name="index" value={formData.index} onChange = {handleChangeText}/>
        <label htmlFor="OAport">OpenAI Port</label>
        <input type="number" id="OAport" name="OAport" value={formData.OAport} onChange = {handleChangeNum}/>
        <label htmlFor="LLMPort">LLama Port</label>
        <input type="number" id="LLMPort" name="LLMPort" value={formData.LLMPort} onChange = {handleChangeNum}/>
        <label htmlFor="textSpeed">Text Speed</label>
        <input type="number" id="textSpeed" name="textSpeed" value={formData.textSpeed} onChange = {handleChangeNum}/>
        <label htmlFor="difficulty">Difficulty</label>
        <input type="number" id="difficulty" name="difficulty" value={formData.difficulty} onChange = {handleChangeNum}/>
        <label htmlFor='max_tokens' id="max_tokens" name = "max_tokens">Max Tokens</label>
        <input type="number" id="max_tokens" name="max_tokens" value={formData.max_tokens} onChange = {handleChangeNum}/>
        <button type="submit">Save</button>
        <button type = "dialog" onClick={() => ref.current.close()}>Cancel</button>
      </form>
    </dialog>
  );
});

export default SettingDialog;

        