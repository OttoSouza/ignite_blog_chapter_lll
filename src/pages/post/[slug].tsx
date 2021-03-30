import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';
import Head from 'next/head';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Prismic from '@prismicio/client';
import { formartInHour, formatDate } from '../../util/formatDate';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    subtitle?: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();
  if (isFallback || !post) {
    return <p>Carregando...</p>;
  }
  const readingTime = Math.ceil(
    RichText.asText(
      post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
    ).split(' ').length / 200
  );
  return (
    <>
      <Head>
        <title>spacetraveling.</title>
      </Head>

      <main className={styles.container}>
        <Header />

        <div>
          <img src={post.data.banner.url} alt="Banner" />
        </div>
        <article className={styles.content}>
          <h1>{post.data.title}</h1>

          <header>
            <div>
              <time>
                <FiCalendar /> {formatDate(post.first_publication_date)}
              </time>
              <p>
                <FiUser /> {post.data.author}
              </p>

              <p>
                <FiClock /> {readingTime} min
              </p>
            </div>
          </header>
          {post.data.content.map(({ heading, body }, key) => (
            <div key={`${post.uid}.${key}`}>
              {heading && <h2>{heading}</h2>}
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(body),
                }}
              />
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 2 }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  console.log(JSON.stringify(response, null, 2));
  return {
    props: { post },
  };
};
