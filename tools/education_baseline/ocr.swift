import Foundation
import AppKit
import PDFKit
import Vision
let args=CommandLine.arguments
guard args.count == 3, let doc=PDFDocument(url:URL(fileURLWithPath:args[1])) else { fatalError("usage: ocr PDF OUTPUT_JSONL") }
FileManager.default.createFile(atPath:args[2],contents:nil)
let output=try FileHandle(forWritingTo:URL(fileURLWithPath:args[2]))
for i in 0..<doc.pageCount {
  try autoreleasepool {
    guard let page=doc.page(at:i) else {return}
    let b=page.bounds(for:.mediaBox)
    let scale=min(3.0,3200.0/b.width)
    let ns=page.thumbnail(of:NSSize(width:b.width*scale,height:b.height*scale),for:.mediaBox)
    guard let cg=ns.cgImage(forProposedRect:nil,context:nil,hints:nil) else {return}
    let req=VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.recognitionLanguages = ["zh-Hans","en-US"]
    req.usesLanguageCorrection = false
    try VNImageRequestHandler(cgImage:cg).perform([req])
    let rows=(req.results ?? []).compactMap { obs -> [String:Any]? in
      guard let x=obs.topCandidates(1).first else {return nil}
      let r=obs.boundingBox
      return ["text":x.string,"confidence":x.confidence,"x":r.minX,"y":1-r.maxY,"w":r.width,"h":r.height]
    }
    let record:[String:Any]=["page":i+1,"width":b.width,"height":b.height,"lines":rows,"engine":"Apple Vision accurate zh-Hans en-US","reviewed":false]
    var data=try JSONSerialization.data(withJSONObject:record,options:[.sortedKeys]);data.append(10);try output.write(contentsOf:data)
    fputs("OCR \(i+1)/\(doc.pageCount)\n",stderr)
  }
}
try output.close()
