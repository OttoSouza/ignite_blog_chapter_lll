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
import Comments from '../../components/Comments/index';

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
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
}

export default function Post({ post, preview, navigation }: PostProps) {
  const { isFallback } = useRouter();

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

  const isPostEdited =
    post.first_publication_date !== post.last_publication_date;

  let editionDate;
  if (isPostEdited) {
    editionDate = formartInHour(post.last_publication_date);
  }

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

            {isPostEdited && (
              <span>{editionDate}</span>
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
        </article>

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={styles.buttonContainer}>Sair do Modo Preview</a>
            </Link>
          </aside>
        )}

        <section className={`${styles.navigation} ${styles.navigationContent}`}>
          {navigation?.prevPost.length > 0 && (
            <div>
              <h3>{navigation.prevPost[0].data.title}</h3>
              <Link href={`/post/${navigation.prevPost[0].uid}`}>
                <a>
                  <span>Post anterior</span>
                </a>
              </Link>
            </div>
          )}
          {navigation?.nextPost.length > 0 && (
            <div>
              <h3>{navigation.nextPost[0].data.title}</h3>
              <Link href={`/post/${navigation.nextPost[0].uid}`}>
                <a>
                  <span>Proximo post</span>
                </a>
              </Link>
            </div>
          )}
        </section>

        <Comments />

        {/* <footer className={styles.footerContainer}>
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
        </footer>

        <div id="inject-comments-for-uterances" /> */}
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
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1, // pegar uma pagina anterior
      after: slug,
      orderings: '[document.first_publication_date]', // quer o antes ou depois, antes
    }
  );

  const nextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
      after: slug,
      orderings: '[document.last_publication_date desc]',
    }
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
  return {
    props: {
      post,
      preview,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
    },
  };
};
