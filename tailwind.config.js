/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					"Roboto",
					"system-ui",
					"-apple-system",
					"BlinkMacSystemFont",
					'"Segoe UI"',
					"Roboto",
					'"Helvetica Neue"',
					"Arial",
					'"Noto Sans"',
					"sans-serif",
					'"Apple Color Emoji"',
					'"Segoe UI Emoji"',
					'"Segoe UI Symbol"',
					'"Noto Color Emoji"',
				],
				serif: ["Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
				Poppins: ["Poppins", "serif"],
				mono: [
					"Menlo",
					"Monaco",
					"Consolas",
					'"Liberation Mono"',
					'"Courier New"',
					"monospace",
				],
			},
			boxShadow: {
				content: "0px 4px 7px rgba(0, 0, 0, 0.1);",
				table: "0px 4px 7px rgb(0 0 0 / 10%)",
			},
			colors: {
				'bodyBg' : 'linear-gradient(50deg, #004182 65.89%, #0A66C2 70.87%, #0A66C2 81.44%, #004182 90.77%)',
				'BlackColor' : '#000000',
				'BlackColor-80' : 'rgb(0 0 0 / 80%)',
				'BlackColor-60' : 'rgb(0 0 0 / 60%)',
				'BlackColor-40' : 'rgb(0 0 0 / 40%)',
				'BlackColor-20' : 'rgb(0 0 0 / 20%)',
				'BlackColor-15' : 'rgb(5 9 38 / 28%)',
				'WhiteColor' : '#ffffff',
				'linkedin-btn-bg' : 'rgb(10 102 194 / 4%)',
				'linkedin-btn-border' : '#E5E7EB',
				'Danger' : '#FD5B5D',
				// LinkedIn brand blue palette
				'LinkedInBlue' : '#0A66C2',
				'LinkedInBlue-dark' : '#004182',
				'LinkedInBlue-light' : '#70B5F9',
				'LinkedInBlue-tint' : '#EBF3FC',
				'YellowLight' : '#0A66C2',
				'YellowLight-20' : 'rgb(10 102 194 / 12%)',
				'GrayBg' : '#F3F2EF',
				'light-blue': '#0A66C2',
				'border-color' : '#9DC8F2',
				'BorderColor-15' : '#E5E7EB',
				'TextareaBg' : '#F6F7F9',
			},
			spacing: {
				'10px':'10px',
				'15px':'15px',
				'20px':'20px',
				'30px':'30px',
			},
			boxShadow: {
				'sign-in-btn-shadow': '2px 4px 4px 0px rgba(0, 0, 0, 0.25);',
				'add-review-shadow' : '1px -80px 20px 270px rgb(0 0 0 / 70%)',
				'pagination-shadow' : '0px 0px 20px 0px rgb(0 0 0 / 15%)'
			},
			backgroundImage: {
				// 'GetStartedBg': "url('../images/get-started-bg-img.png')",
				'SignInBtnBg': "linear-gradient(0deg, #703BE9 0%, #703BE9 100%)",
				'loader-gradient': 'conic-gradient(from 0deg, #0A66C2, #FFFFFF)',
			  },
			  backgroundPosition: {
				'center-bottom': '-50px 290px',
			  },
			  animation: {
				loaderspin: 'loaderspin 1s linear infinite',
			  },
			  keyframes: {
				loaderspin: {
				  '0%': { transform: 'rotate(0deg)' },
				  '100%': { transform: 'rotate(360deg)' },
				},
			  },
		},
	},
	variants: {
		lineClamp: ['responsive'],
	},
	plugins: [
		require('@tailwindcss/line-clamp'),
		// other plugins...
	  ],
};
