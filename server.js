const express = require('express');
const app = express();
const fs = require("fs");
const puppeteer = require('puppeteer');
var PORT = process.env.PORT || 3000;
const startPath = `${__dirname}`;

const scrapeWord = async (word) =>{
    const browser = await puppeteer.launch({'args' : [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]});

    const page = await browser.newPage();

    await page.setRequestInterception(true)
    page.on('request', (request) => {
    if (request.resourceType() === 'image' || request.resourceType() === 'imageset' || request.resourceType() === 'media' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') request.abort()
    else request.continue()
    })

    await page.goto('https://www.merriam-webster.com/', {timeout: 0});

    await page.type('[aria-label="Search"]', word);

    await Promise.all([
        page.click('[class="nav-search-btn desk-search-btn"]'),
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 0 })
  ])

    const data = await page.evaluate( () => {

        var retType = document.querySelector('#left-content > div:nth-child(2) > div:nth-child(1) > span > a');

        if(retType!=null)
        {
            retType = retType.innerText;
        }

        var retDef = document.querySelector('[class="dtText"]');

        if(retDef!=null)
        {
            retDef = retDef.innerText.slice(2);
            var index = retDef.indexOf('\n');
            if(index>-1)
            {
                retDef = retDef.slice(0,index);
            }
        }

        var retOtherWords = document.querySelectorAll('[class="uro"]');

        if(retOtherWords!=null)
        {
            retOtherWords = Array.from(retOtherWords).map(v => {
                var string = v.innerText;
                var index1 = string.indexOf('\\');
                var index2 = string.lastIndexOf('\\');

                if(index1>-1&&index2>-1)
                {
                    var newString = string.slice(0,index1)+string.slice(index2+1);
                    
                    if(newString.indexOf('\n')>-1)
                    {
                        return newString.slice(0,newString.indexOf('\n'));
                    }
                    else{
                        return newString;
                    }

                }
                else{

                    if(string.indexOf('\n')>-1)
                    {
                        return string.slice(0,string.indexOf('\n'));
                    }
                    else{
                        return string;
                    }
                }
                

            });
        }

        var retSent = document.querySelector('.in-sentences > .ex-sent');

        if(retSent!=null)
        {
            retSent = retSent.innerText;

            var index = retSent.indexOf('\n');
            if(index>-1)
            {
                retSent = retSent.slice(0,index);
            }
        }

        return {type: retType, def: retDef, otherWords: retOtherWords, sent: retSent};        

    }).catch(err => console.log(err));

    await browser.close();

    return data; 
}

// async function run(jsonList)
// {
//     try{

//         for (let i = 1; i < jsonList.length; i++) {
//             var object = jsonList[i];
//             console.log("working on: "+object["Vocab Word"]);
//             var data = await scrapeWord(object["Vocab Word"]);
//             object["part of speech"] = data.type;
//             object["definition"] = data.def;
//             object["conjugations"] = data.otherWords;
//             object["Use the word in an original sentence."] = data.sent;
            
//             console.log("finished: "+object["Vocab Word"]);   
//         }


//         return jsonList;
//     }
//     catch(err)
//     {
//         console.log(err);
//     }
// }
// run();

app.get(['/','/index.html','/index'], (req,res)=>{
    console.log('home');
    fs.readFile(startPath + "/index.html", "utf-8", (err, data) => {
        if (err) {
              console.log(err);
              res.redirect('/404');
        }
        else
        {
              res.writeHead(200, { "Content-type": "text" });
              res.end(data);
        }
  });
})

app.get(['/404','/404.html',], (req,res)=>{
    console.log('error');
    fs.readFile(startPath + "/404.html", "utf-8", (err, data) => {
        if (err) {
              console.log(err);
              res.redirect('/404');
        }
        else
        {
              res.writeHead(200, { "Content-type": "text" });
              res.end(data);
        }
  });
})

app.get(/\.(css)$/i, (req,res)=>{
    console.log('css');
    fs.readFile(startPath + req.originalUrl, "utf-8", (err, data) => {
          if (err) {
                console.log(err);
                res.redirect('/404');
          }
          else
          {
                res.writeHead(200, { "Content-type": "text/css" });
                res.end(data);
          }
    }); 
})

app.get(/\.(jpg|jpeg|png|gif)$/i, (req,res)=>{
    console.log('image');
    fs.readFile(startPath + req.originalUrl, (err, data) => {
          if (err) {
                console.log(err);
                res.redirect('/404');
          }
          else{
                res.writeHead(200, { "Content-type": "image/png" });
                res.end(data);
          }
    });
})

app.get('/favicon.ico', function(req, res){
    fs.readFile('./tompkins_school_logo_trans256x256.png', (err, data) => {
        if (err) {
              console.log(err);
              res.redirect('/404');
        }
        else{
              res.writeHead(200, { "Content-type": "image/png" });
              res.end(data);
        }
  });
});

app.get('*', function(req, res){
    console.log(req.url);
    res.writeHead(302, { Location: "404" });
    res.end();
});

app.post('/sendData', (req,res)=>{

    const requestBody = [];
      req.on('data', (chunks)=>{
         requestBody.push(chunks);
      });
      req.on('end', ()=>{
         const parsedData = Buffer.concat(requestBody).toString();
         scrapeWord(parsedData).then(runResult => {
             console.log(runResult);
            res.end(JSON.stringify(runResult));
         }).catch(err => console.log("error here?!? "+err));
      });
    

    

})

app.post('*', function(req, res){
    console.log('no post found');
    res.writeHead(302, { Location: "404" });
    res.end();
});

app.put('*', function(req, res){
    console.log('no put found');
    res.writeHead(302, { Location: "404" });
    res.end();
});

app.delete('*', function(req, res){
    console.log('no delete found');
    res.writeHead(302, { Location: "404" });
    res.end();
});

app.listen(PORT, () => {
    console.log("Listening for reqests on port 3000.");
});