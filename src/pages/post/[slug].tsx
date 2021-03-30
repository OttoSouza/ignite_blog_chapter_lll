import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';
import Head from 'next/head';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import Prismic from '@prismicio/client';
import { formartInHour, formatDate } from '../../util/formatDate';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { PreviewButton } from '../../components/PreviewButton/index';

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
  preview: boolean;
  prevPost: ApiSearchResponse;
  nextPost: ApiSearchResponse;
}

export default function Post({ post, preview, prevPost, nextPost }: PostProps) {
  const { isFallback } = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('theme', 'github-dark');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('repo', 'OttoSouza/ignite_challanger_1_chapter_lll');
    script.setAttribute('issue-term', 'pathname');
    anchor.appendChild(script);
  }, []);

  if (isFallback || !post) {
    return <p>Carregando...</p>;
  }
  const readingTime = Math.ceil(
    RichText.asText(
      post.data.content.reduce(
        (accumulator, data) => [...accumulator, ...data.body],
        []
      )
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

            {post.last_publication_date && (
              <span>{formartInHour(post.first_publication_date)}</span>
            )}
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
          <PreviewButton preview={preview} />
        </article>

        <footer className={styles.footerContainer}>
          {prevPost.results.map(prevPost => (
            <Link href={`/post/${prevPost.uid}`}>
              <a>
                <h3>{prevPost?.data.title}</h3>
                <span>Post anterior</span>
              </a>
            </Link>
          ))}

          {nextPost.results.map(nextPost => (
            <Link href={`/post/${nextPost.uid}`}>
              <a>
                <h3>{nextPost?.data.title}</h3>
                <span>Proximo Post</span>
              </a>
            </Link>
          ))}
        </footer >

        <div id="inject-comments-for-uterances" />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1 }
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const prevPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: slug,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const nextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { pageSize: 1, after: slug, orderings: '[document.first_publication_date]' }
  );

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

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
    props: { post, preview, prevPost, nextPost },
  };
};
