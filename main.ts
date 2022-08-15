const user = "Haselnussbomber";
const repos = [
  "HaselTweaks",
  "LeveHelper",
];

const clearText = (str) => {
  return str
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\*\*(.*)\*\*/g, "$1")
    .split(/\r?\n/g)
    .map(line => line.replace(/^#+\s+/g, ""))
    .join("\n");
};

const output = await Promise.all(repos.map(async (repo) => {
  const res = await fetch(`https://api.github.com/repos/${user}/${repo}/releases/latest`);
  const data = await res.json();
  const base = {
    AssemblyVersion: data.tag_name.replace(/^v/, ""),
    Changelog: clearText(data.body),
    DownloadCount: data.assets[0].download_count,
    LastUpdate: new Date(data.published_at).valueOf() / 1000,
    DownloadLinkInstall: data.assets[0].browser_download_url,
    DownloadLinkUpdate: data.assets[0].browser_download_url,
  };

  const manifestAsset = data.assets.find(asset => asset.name == "manifest.json");
  if (!manifestAsset) {
    return Object.assign({
      Author: user,
      Name: repo,
      InternalName: repo,
      RepoUrl: `https://github.com/${user}/${repo}`,
      ApplicableVersion: "any",
      DalamudApiLevel: 6,
    }, base);
  }
  
  const manifestRes = await fetch(manifestAsset.browser_download_url);
  const manifest = await manifestRes.json();
  return Object.assign(manifest, base);
}));

await Deno.writeTextFile("repo.json", JSON.stringify(output, null, 2));
