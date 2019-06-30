const cheerio = require('cheerio')
const axio = require('axios').default
const qs = require('qs');
const fs = require('fs');
axio.defaults.withCredentials = true;
const CourseID = [
    340738, 340740, 340741,
    340743, 340744, 340745,
    340747, 340748, 340750,
    340751, 340752, 340753,
    340754, 340755, 340756,
    340757, 340758, 340760,
    340761, 340762, 340766,
    340767, 340768, 340769,
    340770, 340771, 340772,
    340773, 340774, 340776,
    340777, 340779, 364466
];


const CourseName = [
    "1.1 Introduction of Course",
    "1.2 Introduction of Object-Oriented Analysis...",
    "1.3 Introduction of Agile Unified Process",
    "2.1 Inception and Case Studies",
    "2.2 UML, UML Tools and UML as Blueprint",
    "2.3 Object-Oriented Analysis and Design Overview",
    "3.1 Requirements Management  and Case Studies",
    "3.2 Use Case",
    "4.1 Elaboration Iteration 1 and Case Studies",
    "4.2 Domain Models",
    "4.3 System Sequence Diagrams",
    "4.4 UML Package Diagrams",
    "4.5 Mapping Analysis Models to Design Models",
    "4.6 UML Interaction Diagrams",
    "4.7 UML Class Diagrams",
    "4.8 GRASP: Designing Objects with Responsibilities",
    "4.9 Mapping Designs to Code",
    "5.1 Elaboration Iteration 2 and Case Studies",
    "5.2 GRASP: More Objects with Responsibilities",
    "5.3 Applying GoF Design Patterns",
    "6.1 Elaboration Iteration 3 and Case Studies",
    "6.2 UML Activity Diagrams and Modeling",
    "6.3 UML State Machine Diagrams and Modeling",
    "6.4 Relating Use Cases",
    "6.5 Domain Model Refinement",
    "6.6 Architecture Design Models Refinement",
    "6.7 More Object Design with GoF Patterns",
    "6.8 Designing a Persistence Framework with Patterns",
    "6.9 Software Architecture Document",
    "7.1 Iterative Development and Agile Project Management",
    "7.2 Software Architecture in Practice",
    "1 FAQs",
    "2 OOP 与 OOAD and UML",
]

// Base request url definition

const BaseMoocUrl = "https://cnmooc.org/study/unit/"; // concat courseid with .mooc ext. Like -> https://cnmooc.org/study/unit/340738.mooc
const VideoPlayUrl = "https://cnmooc.org/study/play.mooc";
const ResourcesUrl = "https://cnmooc.org/item/detail.mooc";
const AdditionalStaticResourceUrl = "https://static.cnmooc.org";
// Fill in your own Cookie
const moocsk = "--";
const moocvk = "--";
const JSESSIONID = "--.tomcat-host1-1";
const BEC = "----|1561910782|1561910700";
const sos = "true";

const AxioRequestConfiguration = {
    headers: {
        Cookie: GetCookieString({ JSESSIONID, moocsk, moocvk, BEC, sos }),
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    // proxy: {
    //     host: "127.0.0.1",
    //     port: 8899
    // },
    maxRedirects: 1
};


async function PrepareReqParameter(Id, CourseTitle) {
    const ReqUrl = BaseMoocUrl + Id + '.mooc';

    // itemId需要用来换nodeId，是获取资源的一个必要值。
    // itemId + nodeId都拿到之后就能开始请求整个课程资源了。
    let itemId = null;
    let nodeId = null;
    console.log(ReqUrl);
    try {
        const { status, data } = await axio.get(ReqUrl, AxioRequestConfiguration);
        if (status === 200) {
            let $1 = cheerio.load(data);
            itemId = $1("input#itemId").val();
        }
        if (itemId != null) {
            // now can load nodeId
            const { status, data } = await axio.post(VideoPlayUrl, qs.stringify({
                itemId: itemId,
                itemType: 10,
                testPaperId: ''
            }), AxioRequestConfiguration);
            if (status === 200) {
                let $2 = cheerio.load(data);
                nodeId = $2("input#nodeId").val();
            }
            if (nodeId != null) {
                await LoadResources(Id, CourseTitle, itemId, nodeId);
            }
        }
    }
    catch (err) {
        console.error("Error occured! ", err);
        return;
    }
}


async function LoadResources(courseId, courseTitle, itemId, nodeId) {
    try {
        const { status, data } = await axio.post(ResourcesUrl, qs.stringify({
            itemId: itemId,
            nodeId: nodeId
        }), AxioRequestConfiguration);

        if (status === 200) {
            const BaseResources = data.node;
            const ExtResources = BaseResources.nodeExts;
            console.log('视频下载地址: ', BaseResources.flvUrl);
            console.log('视频字幕下载地址: ', AdditionalStaticResourceUrl + ExtResources[1].node.rsUrl);
            console.log('课件下载地址: ', AdditionalStaticResourceUrl + ExtResources[0].node.rsUrl);
            fs.writeFileSync(courseId + ' ' + courseTitle + '.json', JSON.stringify(data), { encoding: 'utf-8' });
            console.log('有关资源的整个JSON信息已经保存到' + courseId + ' ' + courseTitle + '.json');
        }
    }
    catch (err) {
        console.error("Error occured! ", err);
        return;
    }
}


async function Main() {
    for (let i = 0; i < CourseID.length; ++i) {
        console.log("正在解析课程 : ", CourseID[i], CourseName[i]);
        await PrepareReqParameter(CourseID[i], CourseName[i]);
        console.log('----------------------------------------');
    }
}

function GetCookieString(cookiesObj) {
    let cookieStr = ""
    for (let name in cookiesObj) {
        cookieStr += name + "=" + cookiesObj[name] + ";"
    }
    return cookieStr.slice(0, cookieStr.length - 1);

}

Main();