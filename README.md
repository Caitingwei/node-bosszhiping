## Node爬虫实战

** 本项目纯属技术探讨，仅供学习和参考，禁止用于非法用途**
**如果你是Node初学者，那么看完该篇文章你将能学会以下东西：**
- node环境的搭建和mysql本地环境的搭建
- express项目搭建并使用babel支持ES6语法
- 将项目部署到服务器

----------

## 演示

- up自己弄了个前端职位的分析图表，通过爬取boss直聘数据
[查看demo请戳这里](https://awei.fun/public/boss)（请用chrome手机模式预览）

## 依赖篇


#### 前言


- 如遇到不懂或有问题，欢迎大家添加qq群 787275772 进行讨论
- 本文章后期将持续更新，可以收藏本文章



----------


#### 环境搭建

1. Node.js 下载，并安装。 [详情步骤](https://www.cnblogs.com/zhouyu2017/p/6485265.html.html)
2. 安装mysql [参考文章](https://www.cnblogs.com/chengxs/p/5986095.html.html)
3. Git 下载，并安装。[详细步骤](https://www.jianshu.com/p/f5b4ba099f66.html)
当以上两个环境安装完毕后，打开git。在命令处填写，并按回车;

```git
$ node -v
v10.8.0
$ npm -v
6.2.0
```
 能顺利打印出版本号则表示node安装成功了;

当mysql安装成功后，我们打开shell 输入

```sql
mysql -h localhost -u 用户名 -p
Enter password:  输入你数据库设置的密码
进来后 先创建数据库
mysql ->  CREATE Database IF NOT EXISTS boss_zhiping Character Set UTF8;
```

##### 4. 安装Express 

```git
npm install express -g

推荐使用cnpm或yarn安装依赖。安装速度比较快。

使用cnpm: cnpm install express -g

使用yarn: yarn add -global express
```
待安装完毕后，使用git跳转到存放项目的位置 执行

```
express projectName && cd projectName
```
注： projectName是你的项目名字，cd是跳转到你的项目名字的根目录下；
进入根目录后执行安装依赖命令 此处使用yarn安装依赖，可根据自己喜好使用

```git
    yarn install
```
此时，一个基于express的项目就搭建好了，我们来给他完善一下目录分层结构，git输入命令

```git
mkdir common  // 公共文件夹
mkdir controllers // 控制器
mkdir database // 数据库
mkdir model // 数据库模型    
```
##### 安装babel 
为了支持es6 7的最新语法，我们使用了babel做支持，让express也支持使用import export 语法;

首先安装babel的各种插件;

```git
cnpm install --save-dev babel babel-cli babel-core babel-helpers babel-preset-es2015 babel-preset-stage-3 babel-register babel-plugin-transform-async-to-generator babel-plugin-transform-es2015-classes babel-plugin-transform-es2015-modules-commonjs babel-plugin-transform-export-extensions
```
我们在根目录文件创建.babelrc文件，输入以下配置;

```json
{
  "presets": ["stage-3"],
  "plugins": [
    "transform-async-to-generator",
      "transform-es2015-modules-commonjs",
      "transform-export-extensions"
  ]
}
```
然后就可以愉快的在express中使用import export 语法了;

----------

#### 分析爬虫所需要用到的依赖插件
- **superagent** superagent是一个请求插件
- **superagent-proxy** superagent的代理插件，配合superagent使用
- **mysql** mysql数据库插件  用于数据的增删改查
- **supervisor** 一个非常好用的热更新插件 代码更改后自动帮你重启node服务
- **node-schedule** 用于执行定时任务 例如定时爬虫 更新数据等等
- **cheerio**  cheerio用于解析响应头的html结构，爬虫必备插件

我们分别安装他们:

```git
yarn add superagent superagent-proxy mysql cheerio node-schedule supervisor
```

具体文件结构我已经写好了，大家可以在github上克隆下来 [点击此处](https://github.com/phonycode/wuss-weapp.html)
```javascript
git clone git@github.com:phonycode/wuss-weapp.git
```
克隆下来大体的目录结构如下

----------
```
|----bin
    |---- www  项目的创建服务器端口
|----common    公共文件
    |---- city_data.js    boss直聘的城市数据
    |---- menu_data.js    boss直聘职位数据
|----controllers    控制器
    |---- city.js   城市模块
    |---- index.js    公共模块/继承
    |---- menu.js   职位菜单模块
    |---- offer.js   职位模块
    |---- proxy.js   代理模块
    |---- reptile.js   爬虫
    |---- statistics.js   数据统计模块
    |---- task.js   自动任务
|----database
    |---- mysql.js    mysql数据库配置
|----models
    |---- initialize.js      初始化数据库表模块
|----public
|----routes    路由
|----views    视图
|----.babelrc    babel配置
|----app.js    express入口文件
|----package.json    
```
----------

## 爬虫原理详解篇

#### 页面分析
   首先我们进入boss直聘官网，选择web前端岗位进入，你会发现链接上多了一个参数:
```
https://www.zhipin.com/c101280100-p100901/
```
看到没```c101280100-p100901``` 就是他的岗位代码.然后继续点击下一页，我们现在进入第二页，发现url又多了个参数
```
https://www.zhipin.com/c101280100-p100901/?page=2&ka=page-2
```
没错，多了个分页信息 ``` ?page=2&ka=page-2``` ，然后我们看职位信息。
![20246ABC-198E-4369-B69E-4A6063395D43.png](https://blog.awei.fun/static/upload/20181205/upload_ae98a8c5a3ee4220ffd65a895309e18d.png)
看到没，当前页的所有职位信息他都用一个ul元素吧每个li渲染出来了。

----------
#### 爬虫准备
   根据上面的分析，我们知道要去请求一个url访问 才能获取到他的职位信息。这时候我们就要用到```superagent```这个插件了，他可以发起一个请求并获取静态网页数据。
```javascript
import request from 'superagent';
const baseUrl = 'https://www.zhipin.com/c101280100-p100901/?page=1&ka=page-1';
request.get(baseUrl).end((error, response) => {
    // response.text ... 请求完成获取到的响应数据
});
```
请求完我们可以看到大概数据是这样的，一个堆字符串数据。
![2AC5DEFF-8C57-4B77-955D-198103802493.png](https://blog.awei.fun/static/upload/20181205/upload_3f5e0e00ec5a969d32b3cd909cfae0fc.png)

如何去解析这些字符串数据呢？接下来我们就会用到```cheerio```这个神器，他可以帮助我们解析html，并且可以进行Jquery的一系列操作，例如元素的查询```$(element).text()```等等,现在我们加上```cheerio```插件。
```javascript
import request from 'superagent';
const baseUrl = 'https://www.zhipin.com/c101280100-p100901/?page=1&ka=page-1';
request.get(baseUrl).end((error, response) => {
    // response.text ... 请求完成获取到的响应数据
    if (error) {
        throw Error(error);
    }
    const $ = cheerio.load(response.text, {
        decodeEntities: false
    });
});
```
有了```cheerio```我们就可以抓取网页上的数据了,现在我们尝试发起请求，我们遍历li下面的数据
![image.png](https://blog.awei.fun/static/upload/20181205/upload_f457c49e5c246ab1a9eb6369f6e21334.png)
```javascript
$('.job-box .job-list ul').find('li').each((index,element) => {
    const el = $(jobList[job_index]);
    const salary = el.find('.info-primary .name .job-title').siblings('span').text().split('-'); // 薪资待遇
    const job_info = el.find('.job-primary .info-primary p').html().replace(/<em class="vline"><\/em>/g, '$%').split('$%');
    const job_company = el.find('.job-primary .info-company .company-text p').html().replace(/<em class="vline"><\/em>/g, '$%').split('$%');
    const detail_url = el.find('.job-primary .info-primary .name').find('a').attr('data-jid');
    const offer = {
        jobId: detail_url,
        name: el.find('.info-primary .name .job-title').text(), // 职位名称
        companyName: el.find('.info-company .company-text .name').find('a').text(), // 公司名称
        minSalary: salary[0], // 薪资待遇
        maxSalary: salary[1], // 薪资待遇
        education: job_info[2], // 学历要求
        experience: job_info[1], // 工作经验
        industry: job_company[0], // 行业类型
        financing: job_company[1], // 融资情况
        companySize: job_company[2], // 公司人数
   };
})
```
上面代码中，我们已经可以拿到当前页的所有职位数据信息了，那如何抓取全部分页的职位数据呢？可以使用**递归**来进行下一页的抓取，直到抓到最后一页为止。
```javascript
import request from 'superagent';
let pageIndex = 1;
const recursive = async () => {
  const baseUrl = `https://www.zhipin.com/c101280100-p100901/?page=${pageIndex}&ka=page-${pageIndex}`;
  request.get(baseUrl).end((error, response) => {
    // response.text ... 请求完成获取到的响应数据
    if (error) {
      throw Error(error);
    }
    const $ = cheerio.load(response.text, {
      decodeEntities: false
    });
    $('.job-box .job-list ul').find('li').each((index, element) => {
      const el = $(jobList[job_index]);
      const salary = el.find('.info-primary .name .job-title').siblings('span').text().split('-'); // 薪资待遇
      const job_info = el.find('.job-primary .info-primary p').html().replace(/<em class="vline"><\/em>/g, '$%').split('$%');
      const job_company = el.find('.job-primary .info-company .company-text p').html().replace(/<em class="vline"><\/em>/g, '$%').split('$%');
      const detail_url = el.find('.job-primary .info-primary .name').find('a').attr('data-jid');
      const offer = {
        jobId: detail_url,
        name: el.find('.info-primary .name .job-title').text(), // 职位名称
        companyName: el.find('.info-company .company-text .name').find('a').text(), // 公司名称
        minSalary: salary[0], // 薪资待遇
        maxSalary: salary[1], // 薪资待遇
        education: job_info[2], // 学历要求
        experience: job_info[1], // 工作经验
        industry: job_company[0], // 行业类型
        financing: job_company[1], // 融资情况
        companySize: job_company[2], // 公司人数
      };
    })
  })
}
recursive();
```
当每次请求完成后让pageindex +1  最后每次请求后判断分页
```javascript
!$('.home-inner .page').find('.next').hasClass('disabled')
```
是否为disabled状态 disabled状态说明已经没有下一页了。则停止抓取。
