import React, { useEffect, useRef, useState } from 'react';
import * as monaco from 'monaco-editor';
import styled from 'styled-components';
import _ from 'lodash';
import { exec } from './MockServer';

type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;

const EditorContainer = styled.div`
  height: 500px;
  width: 49%;
  padding: 3px 3px 0 3px;
  display: inline-block;
`;

const TermContainer = styled.div`
  width: 49%;
  padding: 3px 3px 0 3px;
  display: inline-block;
  height: 500px;
`;

const App: React.FC = () => {
    const [dom, setDom] = useState(undefined as unknown as HTMLElement);
    const [termDom, setTermDom] = useState(undefined as unknown as HTMLElement);
    const [editor, setEditor] = useState(undefined as unknown as IStandaloneCodeEditor);
    const [terminal, setTerminal] = useState(
        undefined as unknown as IStandaloneCodeEditor
    );

    const [historyCmd, setHistoryCmd] = useState([] as string[]);
    const stashCmdRef = useRef('');
    const terminalRef = useRef(terminal);
    const cmdHistoryRef = useRef(historyCmd);
    const activeCmdIndexRef = useRef(0);
    const promptRef = useRef(' $ ');

    const commonConfig = {
        language: 'javascript',
        theme: 'vs-dark',
        minimap: {
            enabled: false,
        },
        formatOnType: true,
        scrollbar: {
            // Subtle shadows to the left & top. Defaults to true.
            useShadows: false,
    
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            arrowSize: 30
        }
    };

    useEffect(() => {
        if (!dom) {
            return;
        }
        const config = _.merge({}, commonConfig, {
            value: 'console.log("hello world")',
        });
        const editor = monaco.editor.create(dom, config);
        setEditor(editor);
    }, [dom]);

    useEffect(() => {
        initKeyBinding();
    }, [editor]);

    useEffect(() => {
        if (!termDom) {
            return;
        }
        const config = _.merge({}, commonConfig, {
            value: '---welcome to console----\n' + promptRef.current,
            readOnly: true,
            lineNumbers: 'off' as const, 
        });
        const monacoTerminal = monaco.editor.create(termDom, config);
        setTerminal(monacoTerminal);
        terminalRef.current = monacoTerminal;
    }, [termDom]);

    function initKeyBinding () {
        if (!editor) {
            return;
        }
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => {
                const terminal = terminalRef.current;
                let line = terminal.getModel()?.getLineCount();
                if (!line) {
                    line = 0;
                }
                let cmd = editor.getValue();
                cmd = cmd.trim();
                onExec(cmd);
                pushCmd();
                editor.setValue('');
                stashCmdRef.current = '';
            }
        );

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow,
            () => {
                if (stashCmdRef.current == '') {
                    stashCmdRef.current = editor.getValue();
                }
                const cmdHistory = cmdHistoryRef.current;
                const activeCmdIndex = activeCmdIndexRef.current;
                if (cmdHistory.length < 1 || activeCmdIndex < 1) {
                    return;
                }
                editor.setValue(cmdHistory[activeCmdIndex - 1]);
                --activeCmdIndexRef.current;
            }
        );

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow,
            () => {
                if (stashCmdRef.current == '') {
                    stashCmdRef.current = editor.getValue();
                }
                const cmdHistory = cmdHistoryRef.current;
                const activeCmdIndex = activeCmdIndexRef.current;
                let cmd = '';
                if (cmdHistory.length > 0 && activeCmdIndex < cmdHistory.length - 1) {
                    cmd = cmdHistory[activeCmdIndex + 1];
                    ++activeCmdIndexRef.current;
                } else {
                    cmd = stashCmdRef.current;
                }
                editor.setValue(cmd);
            }
        );
    }

    function pushCmd () {
        const cmd = editor.getValue();
        if (cmd == '' || cmd == undefined) {
            return cmd;
        }

        setHistoryCmd((preCmd) => {
            const res = [...preCmd, cmd];
            cmdHistoryRef.current = res;
            activeCmdIndexRef.current = res.length;
            console.log('cmd', cmd, activeCmdIndexRef.current);
            return res;
        });
        return cmd;
    }

    function scrollToBottom() {
        const terminal = terminalRef.current;
        const textModel = terminal.getModel();
        if (textModel) {
            terminal.revealLineInCenter(textModel.getLineCount());
            console.log('scroll', textModel.getLineCount());
        }
    }

    // 向结果显示窗口写入值
    function writeToResult (value: string) {
        const terminal = terminalRef.current;
        let line = terminal.getModel()?.getLineCount();
        if (!line) {
            line = 0;
        }

        const range = new monaco.Range(line + 1, 1, line + 1, 1 + value.length);
        const id = { major: 1, minor: 1 };
        const op = {
            identifier: id,
            range: range,
            text: value,
            forceMoveMarkers: true,
        };

        
        terminal.getModel()?.pushEditOperations(null, [op], () => null);
    }

    // 执行命令，正式场景中应该会向后端发送指令
    async function onExec (cmd: string) {
        console.log(cmd, 'cmd');
        writeToResult(cmd + '\n');
        scrollToBottom();
        const res = await exec(cmd);
        writeToResult(res);
        writeToResult('\n' + promptRef.current);
    }

    return (<div>
        <EditorContainer ref={(ref) => setDom(ref as HTMLElement)}></EditorContainer>
        <TermContainer ref={(ref) => setTermDom(ref as HTMLElement)}></TermContainer>
    </div>);
};

export default App;
