import { Router } from "express";
import fs from 'fs';
import path from "path";

import z from "zod";

const configFilePath = path.resolve(__dirname, '../../website-config.json');

export const manageWebsiteRouter = Router();

manageWebsiteRouter.get("/get-config", (_, res) => {
  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"))

  return res.status(200).json({
    ...config
  });
}); // works

manageWebsiteRouter.post("/set-sized-ad", (req, res) => {
  const { adField, code, width, height } = z.object({
    adField: z.string(),
    code: z.string(),
    width: z.number(),
    height: z.number()
  }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));

  config.sizedAds[adField] = {
    code, width, height
  };

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Set success."
  })
}); // works

manageWebsiteRouter.post("/remove-sized-ad", (req, res) => {
  const { adField } = z.object({
    adField: z.string(),

  }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));

  config.sizedAds[adField] = null

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Set success."
  })
}); // works

manageWebsiteRouter.post("/add-footer-script", (req, res) => {
  const { code } = z.object({ code: z.string().min(1) }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.footerScripts = [...config.footerScripts, code];

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Script added successfully."
  })
}); // works

manageWebsiteRouter.post("/remove-footer-script", (req, res) => {
  const { idx } = z.object({ idx: z.number() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.footerScripts.splice(idx, 1);

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Script removed successfully."
  })
}); // works

manageWebsiteRouter.post("/add-ltv-script", (req, res) => {
  const { code } = z.object({ code: z.string().min(1) }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.liveTvScripts = [...config.liveTvScripts, code];

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Script added successfully."
  })
}); // works

manageWebsiteRouter.post("/remove-ltv-script", (req, res) => {
  const { idx } = z.object({ idx: z.number() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.liveTvScripts.splice(idx, 1);

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Script removed successfully."
  })
}); // works

manageWebsiteRouter.post("/set-player-affiliate", (req, res) => {
  const { link } = z.object({ link: z.string().optional().nullish() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.playerPreStartAffiliateLink = link;

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Link set successfully."
  })
}); // works

manageWebsiteRouter.post("/set-admin-notice", (req, res) => {
  const { notice } = z.object({ notice: z.string().nullish().optional() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.adminNotice = notice;

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Notice set successfully."
  })
}); // works

manageWebsiteRouter.post("/set-site-domain", (req, res) => {
  const { domain, name, specificSport, ...input } = z.object({ domain: z.string().min(1), name: z.string().min(1), specificSport: z.string().nullish().optional(), prevDomain: z.string().optional().nullish() }).parse(req.body);
  console.log(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  if (!!input?.prevDomain?.trim()) {
    delete config.domainConfig[input.prevDomain];
  }

  config.domainConfig[domain] = {
    name, specificSport
  };

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Domain set successfully."
  })
}); // works

manageWebsiteRouter.post("/remove-site-domain", (req, res) => {
  const { domain } = z.object({ domain: z.string().min(1) }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  delete config.domainConfig[domain];

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Domain removed successfully."
  })
}); // works

manageWebsiteRouter.post("/add-footer-link", (req, res) => {
  const { name, href, applicableDomains } = z.object({ name: z.string().min(1), href: z.string(), applicableDomains: z.string().nullish().optional() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.footerLinks = [...config.footerLinks, { name, href, applicableDomains }]

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Footer link added successfully."
  })
}); // works

manageWebsiteRouter.post("/edit-footer-link", (req, res) => {
  console.log(req.body)
  const { name, href, applicableDomains, idx } = z.object({ name: z.string().min(1), href: z.string(), applicableDomains: z.string().nullish().optional(), idx: z.number() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.footerLinks[idx] = { name, href, applicableDomains };

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Footer link edited successfully."
  })
}) // works

manageWebsiteRouter.post("/remove-footer-link", (req, res) => {
  const { idx } = z.object({ idx: z.number() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.footerLinks.splice(idx, 1);

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Footer link removed successfully."
  })
}); // works

manageWebsiteRouter.post("/add-head-content", (req, res) => {
  const { code, domains } = z.object({ code: z.string().min(1), domains: z.string().optional().nullish() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.headContent = [...config.headContent, { code, applicableDomains: domains }]

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Head content added successfully."
  })
}); // works

manageWebsiteRouter.post("/edit-head-content", (req, res) => {
  const { code, domains, idx } = z.object({ code: z.string().min(1), domains: z.string().optional().nullish(), idx: z.number() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.headContent[idx] = { code, applicableDomains: domains };

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Head content edited successfully."
  })
}); // works

manageWebsiteRouter.post("/delete-head-content", (req, res) => {
  const { idx } = z.object({ idx: z.number() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.headContent.splice(idx, 1);

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Head content deleted successfully."
  })
}); // works

manageWebsiteRouter.post("/add-body-content", (req, res) => {
  const { code, domains } = z.object({ code: z.string().min(1), domains: z.string().optional().nullish() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.bodyContent = [...config.bodyContent, { code, applicableDomains: domains }]

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Body content added successfully."
  })
}); // works

manageWebsiteRouter.post("/edit-body-content", (req, res) => {
  const { code, domains, idx } = z.object({ code: z.string().min(1), domains: z.string().optional().nullish(), idx: z.number() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.bodyContent[idx] = { code, applicableDomains: domains };

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Body content edited successfully."
  })
}); // works

manageWebsiteRouter.post("/delete-body-content", (req, res) => {
  const { idx } = z.object({ idx: z.number() }).parse(req.body);

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  config.bodyContent.splice(idx, 1);

  fs.writeFileSync(configFilePath, JSON.stringify(config), "utf8");

  return res.status(200).json({
    message: "Body content deleted successfully."
  })
}); // works


