import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Breadcrumb() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <nav className="text-brand my-4 capitalize" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                {pathnames.map((value, index) => {
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    return (
                        <li key={to} className="flex items-center space-x-2">
                            {isLast ? (
                                <span className="text-gray-500">Exhibition {value}</span>
                            ) : (
                                <>
                                    <Link to={to} className="text-brand hover:underline">
                                        Home
                                    </Link>
                                    <span className='text-gray-500'>/</span>
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export default Breadcrumb;
