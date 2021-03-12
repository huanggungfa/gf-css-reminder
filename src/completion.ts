import * as fs from "fs";
import * as vscode from "vscode";
const path = require('path');

const extensionArray: string[] = ["htm", "html", "jsx", "tsx","wxml"];
const htmMatchRegex: RegExp = /class="[\w- ]+"/g;
const sxMatchRegex: RegExp = /className="[\w- ]+"/g;

/**
 * @param {*} document
 * @param {*} position
 * @param {*} token
 * @param {*} context
 */
function provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  _token: vscode.CancellationToken,
  _context: vscode.CompletionContext
) {
  const typeText = document
    .lineAt(position)
    .text.substring(position.character - 1, position.character);
  if (typeText !== ".") {
    return;
  }
  // 获取当前文件路径
  const filePath: string = document.uri.path.includes(":")?document.uri.path.slice(1):document.uri.path;

  let classNames: string[] = [];
  // 在vue文件触发
  if (document.languageId === "vue") {
    // 读取当前文件
    classNames = getClass(filePath);
  }
  // 在css类文件触发
  else {
    // 获取当前文件夹路径
    const dir: string = filePath.slice(0, filePath.lastIndexOf("/"));
    // 读取当前文件夹下的文件名
    const files: string[] = fs.readdirSync(dir);
    // 筛选目标文件
    const target: string[] = files.filter((item: string) =>
      extensionArray.includes(item.split(".")[1])
    );
    // 读取目标文件，获取class
    target.forEach((item: string) => {
      const filePath: string = `${dir}/${item}`;
      classNames = getClass(filePath);
    });
  }

  classNames = classNames.reduce((arr, ele) => {
    const className: string = ele.split("=")[1];
    // 去掉引号
    const field: string = className.slice(1, className.length - 1);
    // 处理多class情况
    if (ele.includes(" ")) {
      return arr.concat(field.split(" "));
    } else {
      arr.push(field);
      return arr;
    }
  }, [] as string[]);

  return classNames.map((ele: string) => {
    return new vscode.CompletionItem(
      // 提示内容要带上触发字符，https://github.com/Microsoft/vscode/issues/71662
      document.languageId === "vue" ? `${ele}` : `.${ele}`,
      vscode.CompletionItemKind.Text
    );
  });
}

function getClass(path: string) {
  const data: string = fs.readFileSync(path, "utf8").split("\n").join("");
  var fileExtension = path.substring(path.lastIndexOf('.') + 1);
  let result;
  // htm/html/vue-->class
  const classFileType = ['htm','html','vue','wxml'];
  if ( classFileType.includes( fileExtension ) ) {
    result = data.match(htmMatchRegex);
  }

  const classNameFileType = ['tsx','jsx'];
  // tsx/jsx-->className
  if ( classNameFileType.includes(fileExtension) ) {
    result = data.match(sxMatchRegex);
  }
  return result || [];
}

/**
 * @param {*} item
 * @param {*} token
 */
function resolveCompletionItem() {
  return null;
} 

/* 
=============================================================================点击光标跳转=======================================
*/

function provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
){
    const fileName    = document.fileName;
    const workDir     = path.dirname(fileName);
    const word        = document.getText(document.getWordRangeAtPosition(position));
    const line        = document.lineAt(position);
    // const projectPath = util.getProjectPath(document);
    console.log('====== 进入 provideDefinition 方法 ======');
    console.log('fileName: ' + fileName); // 当前文件完整路径
    console.log('workDir: ' + workDir); // 当前文件所在目录
    console.log('word: ' + word);       // 当前光标所在单词
    console.log('line: ' + line.text); // 当前光标所在行

    return new vscode.Location(vscode.Uri.file('E:/gf-test/demo/index.css'), new vscode.Position(2, 0));
    // if ( /\.css$/.test(fileName) ) {
    //     console.log(word, line.text);
    //     // const json = document.getText();
    //     // if (new RegExp(`"(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?${word.replace(/\//g, '\\/')}[\\s\\S]*?\\}`, 'gm').test(json)) {
    //     //     let destPath = `${workDir}/node_modules/${word.replace(/"/g, '')}/package.json`;
    //     //     if (fs.existsSync(destPath)) {
    //     //         // new vscode.Position(0, 0) 表示跳转到某个文件的第一行第一列
    //     //         return new vscode.Location(vscode.Uri.file(destPath), new vscode.Position(0, 0));
    //     //     }
    //     // }
    // }
}

export default function (context: vscode.ExtensionContext) {
  // 注册代码建议提示，只有当按下“.”时才触发
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            [
                { scheme: "file", language: "css" },
                { scheme: "file", language: "less" },
                { scheme: "file", language: "scss" },
                { scheme: "file", language: "sass" },
                { scheme: "file", language: "stylus" },
                { scheme: "file", language: "vue" },
            ],
            {
                provideCompletionItems,
                resolveCompletionItem,
            },
            "."
        ),
        vscode.languages.registerDefinitionProvider(
            [
                { scheme: "file", language: "html" },
                { scheme: "file", language: "htm" },
                { scheme: "file", language: "vue" },
                { scheme: "file", language: "wxml" }
            ],
            {
                provideDefinition
            })
    );
}
