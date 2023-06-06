"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EasyInvoice = void 0;
const axios_1 = __importDefault(require("axios"));
// @ts-ignore
const is_base64_1 = __importDefault(require("is-base64"));
// @ts-ignore
const file_saver_1 = __importDefault(require("file-saver"));
const js_base64_1 = require("js-base64");
const pdfjs_dist_1 = require("pdfjs-dist");
let printJs;
if (typeof window !== 'undefined') {
    Promise.resolve().then(() => __importStar(require('print-js'))).then((module) => {
        printJs = module.default;
    })
        .catch((err) => {
        console.error('Failed to load print-js:', err);
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    pdfjs_dist_1.GlobalWorkerOptions.workerSrc = yield Promise.resolve().then(() => __importStar(require(
    // @ts-ignore
    "pdfjs-dist/build/pdf.worker.entry")));
}))();
class EasyInvoice {
    constructor(pdf, totalPages, renderedPdf, elementId) {
        this._pdf = pdf;
        this._totalPages = totalPages;
        this._renderedPdf = renderedPdf;
        this._elementId = elementId;
    }
    createInvoice(options, cb = () => {
    }) {
        return new Promise((resolve, reject) => {
            const url = 'https://api.easyinvoice.cloud/v2/free/invoices';
            const data = {
                data: options
            };
            const config = {
                headers: {
                    'easyinvoice-source': 'npm'
                }
            };
            axios_1.default.create().post(url, data, config)
                .then((response) => {
                /* istanbul ignore next */
                const result = response.data.data;
                /* istanbul ignore next */
                this._pdf = result.pdf;
                /* istanbul ignore next */
                resolve(result);
                /* istanbul ignore next */
                cb(result);
            })
                .catch((error) => {
                /* istanbul ignore next */
                console.log(error.response.data);
                /* istanbul ignore next */
                reject(error.response.data);
                /* istanbul ignore next */
                cb(error.response.data);
            });
        });
    }
    /* istanbul ignore next */
    download(filename = 'invoice.pdf', pdf = this._pdf) {
        if (filename === undefined || (0, is_base64_1.default)(filename)) {
            throw new Error('Invalid filename.');
        }
        if (typeof window === 'undefined') {
            throw new Error('Easy Invoice download() is only supported in the browser.');
        }
        else {
            downloadFile(filename, 'application/pdf', pdf);
        }
    }
    /* istanbul ignore next */
    print(pdf = this._pdf) {
        printJs({
            printable: pdf,
            type: "pdf",
            base64: true
        });
    }
    /* istanbul ignore next */
    render(elementId, pdf = this._pdf, cb = () => {
    }) {
        return new Promise((resolve) => {
            if (typeof window === 'undefined') {
                throw new Error('Easy Invoice render() is only supported in the browser.');
            }
            else {
                this._elementId = elementId;
                this.renderPdf(pdf, function (renderFinished) {
                    resolve(renderFinished);
                    cb(renderFinished);
                });
            }
        });
    }
    /* istanbul ignore next */
    renderPdf(pdfBase64, renderFinished) {
        // @ts-ignore
        const loadingTask = (0, pdfjs_dist_1.getDocument)({ data: js_base64_1.Base64.atob(pdfBase64) });
        loadingTask.promise.then((pdf) => {
            // console.log('PDF loaded');
            this._totalPages = pdf.numPages;
            this._renderedPdf = pdf;
            this.renderPage(1, renderFinished);
        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });
    }
    /* istanbul ignore next */
    renderPage(pageNumber, renderFinished) {
        this._renderedPdf.getPage(pageNumber).then((page) => {
            // console.log('Page loaded');
            const canvas = document.createElement('canvas');
            const viewport = isMobileBrowser() ? page.getViewport({ scale: window.screen.width / page.getViewport({ scale: 1.0 }).width }) : page.getViewport({ scale: Math.max(window.devicePixelRatio || 1, 1) });
            // @ts-ignore
            document.getElementById(this._elementId).innerHTML = "";
            const canvasWrapper = document.getElementById(this._elementId);
            // @ts-ignore
            canvasWrapper.appendChild(canvas);
            // Prepare canvas using PDF page dimensions
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            // Render PDF page into canvas context
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            const renderTask = page.render(renderContext);
            renderTask.promise.then(function () {
                // console.log('Page rendered');
                renderFinished(true);
            });
        });
    }
}
exports.EasyInvoice = EasyInvoice;
/* istanbul ignore next */
function downloadFile(fileName, contentType, base64) {
    const blob = base64toBlob(base64, contentType);
    file_saver_1.default.saveAs(blob, fileName);
}
/* istanbul ignore next */
function base64toBlob(base64Data, contentType) {
    contentType = contentType || '';
    const sliceSize = 1024;
    const byteCharacters = js_base64_1.Base64.atob(base64Data);
    // var byteCharacters = decodeURIComponent(escape(Base64.atob(base64Data)))
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);
    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        const begin = sliceIndex * sliceSize;
        const end = Math.min(begin + sliceSize, bytesLength);
        const bytes = new Array(end - begin);
        for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, {
        type: contentType
    });
}
/* eslint-disable */
/* istanbul ignore next */
function isMobileBrowser() {
    var ua = navigator.userAgent;
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4))) {
        return true;
    }
    else {
        return false;
    }
}
/* eslint-enable */
// @ts-ignore
exports.default = new EasyInvoice();
if (typeof window === 'undefined') {
    // @ts-ignore
    module.exports = new EasyInvoice();
}
// @ts-ignore
globalThis.easyinvoice = new EasyInvoice();
