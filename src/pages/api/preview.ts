import { NextApiRequest, NextApiResponse } from 'next';
import { Document } from '@prismicio/client/types/documents';
//import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
export const apiEndpoint = process.env.PRISMIC_API_ENDPOINT;
export const accessToken = process.env.PRISMIC_ACCESS_TOKEN;

function linkResolver(doc: Document): string {
  if (doc.type === 'post') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

const Client = (req = null) =>
  Prismic.client(apiEndpoint, createClientOptions(req, accessToken));

const createClientOptions = (req = null, prismicAccessToken = null) => {
  const reqOption = req ? { req } : {};
  const accessTokenOption = prismicAccessToken
    ? { accessToken: prismicAccessToken }
    : {};
  return {
    ...reqOption,
    ...accessTokenOption,
  };
};

const Preview = async (req: NextApiRequest, res: NextApiResponse) => {
  const { token: ref, documentId } = req.query;
  const redirectUrl = await Client(req)
    .getPreviewResolver(ref as string, documentId as string)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });
  res.writeHead(302, { Location: `${redirectUrl}` });
  res.end();
};

export default Preview;

// const Preview = async (req: NextApiRequest, res: NextApiResponse) => {
//   const { token: ref, documentId } = req.query;
//   const redirectUrl = await getPrismicClient(req)
//     .getPreviewResolver(ref as string, documentId as string)
//     .resolve(linkResolver, '/');

//   if (!redirectUrl) {
//     return res.status(401).json({ message: 'Invalid token' });
//   }

//   res.setPreviewData({ ref });
//   res.writeHead(302, { Location: `${redirectUrl}` });
//   res.end();
// };
