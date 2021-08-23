import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import "xterm/css/xterm.css";
import * as monaco from "monaco-editor";
import styled from "styled-components";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";
import { WebLinksAddon } from "xterm-addon-web-links";

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

const EditorContainer = styled.div`
  height: 500px;
  width: 48%;
  padding: 5px;
  display: inline-block;
`;

const TermContainer = styled.div`
  width: 48%;
  padding: 5px;
  display: inline-block;
  height: 500px;
`;

const App: React.FC = () => {
  const [dom, setDom] = useState(undefined as unknown as HTMLElement);
  const [termDom, setTermDom] = useState(undefined as unknown as HTMLElement);
  const [editor, setEditor] = useState(
    undefined as unknown as IStandaloneCodeEditor
  );
  const [terminal, setTerminal] = useState(
    undefined as unknown as IStandaloneCodeEditor
  );

  const [historyCmd, setHistoryCmd] = useState([] as string[]);
  const stashCmdRef = useRef('');
  const terminalRef = useRef(terminal);
  const cmdHistoryRef = useRef(historyCmd);
  const activeCmdIndexRef = useRef(0);
  useEffect(() => {
    if (!dom) {
      return;
    }
    const editor = monaco.editor.create(dom, {
      value:
        'local str = "welcome" ',
      language: "lua",
      theme: "vs-dark",
    });
    setEditor(editor);
  }, [dom]);

  useEffect(() => {
    initKeyBinding();
  }, [editor]);

  useEffect(() => {
    if (!termDom) {
      return;
    }

    const monacoTerminal = monaco.editor.create(termDom, {
		readOnly: true,
		value: 'xxxx$  ',
      language: "lua",
      theme: "vs-dark",
    });
    setTerminal(monacoTerminal);
    terminalRef.current = monacoTerminal;
  }, [termDom]);

  function initKeyBinding() {
    if (!editor) {
      return;
    }
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      function () {
        const terminal = terminalRef.current;
        let line = terminal.getModel()?.getLineCount();
        if (!line) {
          line = 0;
        }
		const cmd = editor.getValue();
        const text = cmd + "\n xxxx$  ";
        const range = new monaco.Range(line + 1, 1, line + 1, 1 + text.length);
        const id = { major: 1, minor: 1 };
        const op = {
          identifier: id,
          range: range,
          text: text,
          forceMoveMarkers: true,
        };
		
        terminal.getModel()?.pushEditOperations(null, [op], ()=>null);
		pushCmd();
		editor.setValue('');
		stashCmdRef.current = '';
      }
    );

	editor.addCommand(
		monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow,
		function () {
			if(stashCmdRef.current == '') {
				stashCmdRef.current = editor.getValue();
			}
			const cmdHistory = cmdHistoryRef.current;
			const activeCmdIndex = activeCmdIndexRef.current;
			if(cmdHistory.length < 1 || activeCmdIndex < 1) {
				return;
			}
		  editor.setValue(cmdHistory[activeCmdIndex - 1]);
			--activeCmdIndexRef.current;
		}
	  );

	  editor.addCommand(
		monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow,
		function () {
			if(stashCmdRef.current == '') {
				stashCmdRef.current = editor.getValue();
			}
			const cmdHistory = cmdHistoryRef.current;
			const activeCmdIndex = activeCmdIndexRef.current;
			let cmd = '';
			if(cmdHistory.length > 0 && activeCmdIndex < cmdHistory.length - 1) {
				cmd = cmdHistory[activeCmdIndex + 1];
        ++activeCmdIndexRef.current;
			} else {
				cmd = stashCmdRef.current
			}
		  	editor.setValue(cmd);
		}
	  );
  }

  function pushCmd() {
	  const cmd = editor.getValue();
	  if(cmd == '' || cmd == undefined) {
		  return cmd;
	  }
	  
	  setHistoryCmd((preCmd)=>{
		const res = [...preCmd, cmd];
		cmdHistoryRef.current = res;
		activeCmdIndexRef.current = res.length;
		console.log('cmd', cmd, activeCmdIndexRef.current);
		return res;
	});
	return cmd;
  }

  return (
    <div>
      <EditorContainer
        ref={(ref) => setDom(ref as HTMLElement)}
      ></EditorContainer>
      <TermContainer
        ref={(ref) => setTermDom(ref as HTMLElement)}
      ></TermContainer>
    </div>
  );
};

export default App;
